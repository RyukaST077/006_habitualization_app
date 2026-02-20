import { execFile } from "node:child_process";
import { promisify } from "node:util";

export type CoreTableName =
  | "profiles"
  | "habits"
  | "habit_logs"
  | "policy_settings"
  | "policy_consents"
  | "audit_logs";

export interface ColumnMetadata {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultExpression: string | null;
}

export interface RlsPolicyMetadata {
  name: string;
  command: "select" | "insert" | "update" | "delete" | "all";
  usingExpression: string;
  checkExpression: string | null;
}

export interface TableSchemaMetadata {
  tableName: CoreTableName;
  columns: ColumnMetadata[];
  constraints: string[];
  indexes: string[];
  triggers: string[];
  rlsEnabled: boolean;
  rlsPolicies: RlsPolicyMetadata[];
}

export interface SchemaIntrospectionPort {
  getTableSchemaMetadata(tableName: CoreTableName): Promise<TableSchemaMetadata>;
  hasUniqueConstraint(
    tableName: CoreTableName,
    constraintName: string,
    columns: string[],
  ): Promise<boolean>;
  hasForeignKeyConstraint(
    tableName: CoreTableName,
    constraintName: string,
    referencedTable: string,
  ): Promise<boolean>;
  hasCheckConstraint(
    tableName: CoreTableName,
    constraintName: string,
    requiredDefinitionFragments?: string[],
  ): Promise<boolean>;
  hasRlsPolicy(
    tableName: CoreTableName,
    policyName: string,
    command?: RlsPolicyMetadata["command"],
  ): Promise<boolean>;
  hasTrigger(tableName: CoreTableName, triggerName: string): Promise<boolean>;
}

const execFileAsync = promisify(execFile);

type QueryRow = Record<string, string>;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for schema introspection tests");
  }

  return databaseUrl;
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

function formatTextArray(values: string[]): string {
  const escapedValues = values.map((value) => `'${escapeSqlLiteral(value)}'`);

  return `ARRAY[${escapedValues.join(", ")}]::text[]`;
}

async function queryRows(sql: string): Promise<QueryRow[]> {
  const { stdout } = await execFileAsync("psql", [
    getDatabaseUrl(),
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-A",
    "-F",
    "\t",
    "-P",
    "footer=off",
    "-c",
    sql,
  ]);

  const lines = stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split("\t");
  const rows: QueryRow[] = [];

  for (const line of lines.slice(1)) {
    const values = line.split("\t");
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    rows.push(row);
  }

  return rows;
}

async function queryBoolean(sql: string): Promise<boolean> {
  const rows = await queryRows(sql);

  if (rows.length === 0) {
    return false;
  }

  return Object.values(rows[0])[0] === "t";
}

type RawTableSchemaMetadata = {
  columns: ColumnMetadata[];
  constraints: string[];
  indexes: string[];
  triggers: string[];
  rlsEnabled: boolean;
  rlsPolicies: Array<{
    name: string;
    command: string;
    usingExpression: string;
    checkExpression: string | null;
  }>;
};

function normalizePolicyCommand(command: string): RlsPolicyMetadata["command"] {
  const normalized = command.toLowerCase();
  if (
    normalized === "select" ||
    normalized === "insert" ||
    normalized === "update" ||
    normalized === "delete" ||
    normalized === "all"
  ) {
    return normalized;
  }

  return "all";
}

export function createSchemaIntrospectionPort(): SchemaIntrospectionPort {
  return {
    async getTableSchemaMetadata(tableName: CoreTableName): Promise<TableSchemaMetadata> {
      const escapedTableName = escapeSqlLiteral(tableName);
      const rows = await queryRows(`
        SELECT json_build_object(
          'columns',
          COALESCE((
            SELECT json_agg(json_build_object(
              'name', c.column_name,
              'dataType', c.data_type,
              'isNullable', c.is_nullable = 'YES',
              'defaultExpression', c.column_default
            ) ORDER BY c.ordinal_position)
            FROM information_schema.columns c
            WHERE c.table_schema = 'public' AND c.table_name = '${escapedTableName}'
          ), '[]'::json),
          'constraints',
          COALESCE((
            SELECT json_agg(tc.constraint_name ORDER BY tc.constraint_name)
            FROM information_schema.table_constraints tc
            WHERE tc.table_schema = 'public' AND tc.table_name = '${escapedTableName}'
          ), '[]'::json),
          'indexes',
          COALESCE((
            SELECT json_agg(i.indexname ORDER BY i.indexname)
            FROM pg_indexes i
            WHERE i.schemaname = 'public' AND i.tablename = '${escapedTableName}'
          ), '[]'::json),
          'triggers',
          COALESCE((
            SELECT json_agg(t.trigger_name ORDER BY t.trigger_name)
            FROM (
              SELECT DISTINCT tr.trigger_name
              FROM information_schema.triggers tr
              WHERE tr.trigger_schema = 'public' AND tr.event_object_table = '${escapedTableName}'
            ) t
          ), '[]'::json),
          'rlsEnabled',
          COALESCE((
            SELECT cls.relrowsecurity
            FROM pg_class cls
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            WHERE ns.nspname = 'public' AND cls.relname = '${escapedTableName}'
          ), false),
          'rlsPolicies',
          COALESCE((
            SELECT json_agg(json_build_object(
              'name', p.policyname,
              'command', p.cmd,
              'usingExpression', COALESCE(p.qual, ''),
              'checkExpression', p.with_check
            ) ORDER BY p.policyname, p.cmd)
            FROM pg_policies p
            WHERE p.schemaname = 'public' AND p.tablename = '${escapedTableName}'
          ), '[]'::json)
        ) AS metadata
      `);

      if (rows.length === 0 || !rows[0].metadata) {
        throw new Error(`Failed to introspect table schema metadata for ${tableName}`);
      }

      const metadata = JSON.parse(rows[0].metadata) as RawTableSchemaMetadata;

      return {
        tableName,
        columns: metadata.columns,
        constraints: metadata.constraints,
        indexes: metadata.indexes,
        triggers: metadata.triggers,
        rlsEnabled: metadata.rlsEnabled,
        rlsPolicies: metadata.rlsPolicies.map((policy) => ({
          name: policy.name,
          command: normalizePolicyCommand(policy.command),
          usingExpression: policy.usingExpression,
          checkExpression: policy.checkExpression,
        })),
      };
    },
    async hasUniqueConstraint(
      tableName: CoreTableName,
      constraintName: string,
      columns: string[],
    ): Promise<boolean> {
      const escapedTableName = escapeSqlLiteral(tableName);
      const escapedConstraintName = escapeSqlLiteral(constraintName);
      const expectedColumns = formatTextArray(columns);

      return queryBoolean(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class tbl ON tbl.oid = c.conrelid
          JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
          WHERE ns.nspname = 'public'
            AND tbl.relname = '${escapedTableName}'
            AND c.contype = 'u'
            AND c.conname = '${escapedConstraintName}'
            AND (
              SELECT array_agg(att.attname::text ORDER BY key.ord)
              FROM unnest(c.conkey) WITH ORDINALITY AS key(attnum, ord)
              JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = key.attnum
            ) = ${expectedColumns}
        ) AS has_unique
      `);
    },
    async hasForeignKeyConstraint(
      tableName: CoreTableName,
      constraintName: string,
      referencedTable: string,
    ): Promise<boolean> {
      const escapedTableName = escapeSqlLiteral(tableName);
      const escapedConstraintName = escapeSqlLiteral(constraintName);
      const escapedReferencedTable = escapeSqlLiteral(referencedTable);

      return queryBoolean(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class src_tbl ON src_tbl.oid = c.conrelid
          JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
          JOIN pg_class ref_tbl ON ref_tbl.oid = c.confrelid
          JOIN pg_namespace ref_ns ON ref_ns.oid = ref_tbl.relnamespace
          WHERE src_ns.nspname = 'public'
            AND ref_ns.nspname = 'public'
            AND src_tbl.relname = '${escapedTableName}'
            AND ref_tbl.relname = '${escapedReferencedTable}'
            AND c.contype = 'f'
            AND c.conname = '${escapedConstraintName}'
        ) AS has_fk
      `);
    },
    async hasCheckConstraint(
      tableName: CoreTableName,
      constraintName: string,
      requiredDefinitionFragments: string[] = [],
    ): Promise<boolean> {
      const escapedTableName = escapeSqlLiteral(tableName);
      const escapedConstraintName = escapeSqlLiteral(constraintName);
      const rows = await queryRows(`
        SELECT pg_get_constraintdef(c.oid) AS definition
        FROM pg_constraint c
        JOIN pg_class tbl ON tbl.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        WHERE ns.nspname = 'public'
          AND tbl.relname = '${escapedTableName}'
          AND c.contype = 'c'
          AND c.conname = '${escapedConstraintName}'
      `);

      if (rows.length === 0) {
        return false;
      }

      const definition = (rows[0].definition ?? "").toLowerCase();
      return requiredDefinitionFragments.every((fragment) =>
        definition.includes(fragment.toLowerCase()),
      );
    },
    async hasRlsPolicy(
      tableName: CoreTableName,
      policyName: string,
      command?: RlsPolicyMetadata["command"],
    ): Promise<boolean> {
      const escapedTableName = escapeSqlLiteral(tableName);
      const escapedPolicyName = escapeSqlLiteral(policyName);
      const escapedCommand = command ? escapeSqlLiteral(command) : "";

      return queryBoolean(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_policies p
          WHERE p.schemaname = 'public'
            AND p.tablename = '${escapedTableName}'
            AND p.policyname = '${escapedPolicyName}'
            AND ('${escapedCommand}' = '' OR p.cmd = '${escapedCommand}' OR p.cmd = 'ALL')
        ) AS has_policy
      `);
    },
    async hasTrigger(tableName: CoreTableName, triggerName: string): Promise<boolean> {
      const escapedTableName = escapeSqlLiteral(tableName);
      const escapedTriggerName = escapeSqlLiteral(triggerName);

      return queryBoolean(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.triggers tr
          WHERE tr.trigger_schema = 'public'
            AND tr.event_object_table = '${escapedTableName}'
            AND tr.trigger_name = '${escapedTriggerName}'
        ) AS has_trigger
      `);
    },
  };
}

export function createPendingSchemaIntrospectionPort(): SchemaIntrospectionPort {
  return createSchemaIntrospectionPort();
}
