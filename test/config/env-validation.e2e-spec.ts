import { validateEnv } from '../../src/config/env.validation';

describe('Environment validation', () => {
  it('throws when SESSION_SECRET is missing outside test mode', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'file:./prisma/dev.db',
      }),
    ).toThrow('SESSION_SECRET is required');
  });

  it('accepts missing SESSION_SECRET in test mode', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./prisma/dev.db',
    });

    expect(result.SESSION_SECRET).toBeDefined();
  });
});
