export type DdlMatcher = RegExp | string;

export function hasDdlMatcher(sql: string, matcher: DdlMatcher): boolean {
  if (matcher instanceof RegExp) return matcher.test(sql);
  return sql.toLowerCase().includes(matcher.toLowerCase());
}

function collectNamedObjects(sql: string, pattern: RegExp): string[] {
  const found = new Set<string>();

  for (const match of sql.matchAll(pattern)) {
    const name = match[1]?.trim();
    if (name) found.add(name);
  }

  return [...found];
}

export function listConstraintNames(sql: string): string[] {
  return collectNamedObjects(sql, /add\s+constraint\s+([a-zA-Z0-9_]+)/gi);
}

export function listIndexNames(sql: string): string[] {
  return collectNamedObjects(sql, /create\s+(?:unique\s+)?index\s+([a-zA-Z0-9_]+)/gi);
}

export function hasConstraintName(sql: string, constraintName: string): boolean {
  return listConstraintNames(sql).includes(constraintName);
}

export function hasIndexName(sql: string, indexName: string): boolean {
  return listIndexNames(sql).includes(indexName);
}

export function hasCreateTable(sql: string, tableName: string): boolean {
  const pattern = new RegExp(`create\\s+table\\s+${tableName}\\b`, 'i');
  return hasDdlMatcher(sql, pattern);
}

export function listCreateTableNames(sql: string): string[] {
  return collectNamedObjects(sql, /create\s+table\s+([a-zA-Z0-9_]+)/gi);
}
