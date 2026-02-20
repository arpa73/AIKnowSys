import { describe, expect, it } from 'vitest';
import { isSqliteConstraintError } from '../../lib/utils/sqlite-utils.js';

describe('isSqliteConstraintError', () => {
  it('returns true for sqlite constraint error code', () => {
    expect(isSqliteConstraintError({ code: 'SQLITE_CONSTRAINT_UNIQUE' })).toBe(true);
  });

  it('returns true for unique constraint message', () => {
    expect(isSqliteConstraintError({ message: 'UNIQUE constraint failed: plans.id' })).toBe(true);
  });

  it('returns false for non-constraint errors', () => {
    expect(isSqliteConstraintError(new Error('something else'))).toBe(false);
  });
});
