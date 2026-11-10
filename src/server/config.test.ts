import { describe, expect, it } from 'vitest';
import { assertTestOnlyDatabase, isTestDatabase } from '@/server/config';

describe('assertTestOnlyDatabase', () => {
  it('refuses development even with a local URL', () => {
    const env = {
      APP_ENV: 'development',
      DB_TARGET: 'development',
      TEST_DATABASE_URL: 'postgresql://travelar_test:x@localhost:5432/travelar_test',
    };
    expect(isTestDatabase(env)).toBe(false);
    expect(() => assertTestOnlyDatabase(env)).toThrow('refused_non_test_database');
  });

  it('refuses a remote host even when env says test', () => {
    const env = {
      APP_ENV: 'test',
      DB_TARGET: 'test',
      TEST_DATABASE_URL: 'postgresql://travelar_test:x@db.example.com:5432/travelar_test',
    };
    expect(() => assertTestOnlyDatabase(env)).toThrow('refused_remote_restore_target');
  });

  it('accepts a local test URL', () => {
    const env = {
      APP_ENV: 'test',
      DB_TARGET: 'test',
      TEST_DATABASE_URL: 'postgresql://travelar_test:x@127.0.0.1:5432/travelar_test',
    };
    expect(assertTestOnlyDatabase(env).connectionString).toContain('127.0.0.1');
  });
});
