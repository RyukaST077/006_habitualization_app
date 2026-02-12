export type DdlMatcher = RegExp | string;

export function hasDdlMatcher(sql: string, matcher: DdlMatcher): boolean {
  if (matcher instanceof RegExp) return matcher.test(sql);
  return sql.toLowerCase().includes(matcher.toLowerCase());
}

