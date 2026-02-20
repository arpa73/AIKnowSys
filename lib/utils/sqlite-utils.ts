export function isSqliteConstraintError(error: unknown): boolean {
  const sqliteError = error as { code?: string; message?: string };
  return Boolean(
    sqliteError.code?.startsWith('SQLITE_CONSTRAINT')
      || sqliteError.message?.includes('UNIQUE constraint')
  );
}
