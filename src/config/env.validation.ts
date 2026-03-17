const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

export function validateEnv(config: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const nodeEnv = config.NODE_ENV ?? (config.JEST_WORKER_ID ? 'test' : 'development');

  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV "${nodeEnv}".`);
  }

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }

  const sessionSecret =
    config.SESSION_SECRET ??
    (nodeEnv === 'test' ? 'test-session-secret-not-for-production' : undefined);

  if (!sessionSecret || sessionSecret.length < 16) {
    throw new Error('SESSION_SECRET is required and must be at least 16 characters.');
  }

  const port = parseInteger(config.PORT, 3000);
  if (port < 1 || port > 65535) {
    throw new Error('PORT must be between 1 and 65535.');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: String(port),
    SESSION_SECRET: sessionSecret,
    SESSION_DB_PATH: config.SESSION_DB_PATH ?? './prisma/sessions.db',
    SESSION_COOKIE_MAX_AGE_MS: String(
      parseInteger(config.SESSION_COOKIE_MAX_AGE_MS, 1000 * 60 * 60),
    ),
    SESSION_COOKIE_SECURE: String(
      parseBoolean(config.SESSION_COOKIE_SECURE, nodeEnv === 'production'),
    ),
    TRUST_PROXY: String(parseBoolean(config.TRUST_PROXY, nodeEnv === 'production')),
    ENABLE_CSRF: String(parseBoolean(config.ENABLE_CSRF, nodeEnv !== 'test')),
    LOGIN_RATE_LIMIT_WINDOW_MS: String(
      parseInteger(config.LOGIN_RATE_LIMIT_WINDOW_MS, 60_000),
    ),
    LOGIN_RATE_LIMIT_MAX: String(parseInteger(config.LOGIN_RATE_LIMIT_MAX, 20)),
  };
}
