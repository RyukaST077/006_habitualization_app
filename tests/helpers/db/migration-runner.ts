import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_MIGRATION_PATH = 'supabase/migrations/00000000000000_init.sql';

export function loadMigrationSql(migrationPath = DEFAULT_MIGRATION_PATH): string {
  const absolutePath = path.resolve(process.cwd(), migrationPath);
  return readFileSync(absolutePath, 'utf-8');
}

