export type CoreTableName = "profiles" | "habits" | "habit_logs";

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
  getTableSchemaMetadata(tableName: CoreTableName): Promise<TableSchemaMetadata | null>;
  hasUniqueConstraint(
    tableName: CoreTableName,
    constraintName: string,
    columns: string[],
  ): Promise<boolean | null>;
  hasForeignKeyConstraint(
    tableName: CoreTableName,
    constraintName: string,
    referencedTable: string,
  ): Promise<boolean | null>;
  hasTrigger(tableName: CoreTableName, triggerName: string): Promise<boolean | null>;
}

export function createPendingSchemaIntrospectionPort(): SchemaIntrospectionPort {
  return {
    async getTableSchemaMetadata(): Promise<TableSchemaMetadata | null> {
      return null;
    },
    async hasUniqueConstraint(): Promise<boolean | null> {
      return null;
    },
    async hasForeignKeyConstraint(): Promise<boolean | null> {
      return null;
    },
    async hasTrigger(): Promise<boolean | null> {
      return null;
    },
  };
}
