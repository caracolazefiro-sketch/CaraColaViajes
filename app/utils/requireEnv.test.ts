import { describe, it, expect, afterEach } from 'vitest';
import requireEnv from './requireEnv';

describe('requireEnv', () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('returns the value when env var is set', () => {
    process.env.TEST_VAR = 'ok';
    expect(requireEnv('TEST_VAR')).toBe('ok');
  });

  it('throws when env var is missing', () => {
    delete process.env.TEST_VAR;
    expect(() => requireEnv('TEST_VAR')).toThrow(/Environment variable TEST_VAR is required/);
  });
});
