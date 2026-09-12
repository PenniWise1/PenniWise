import dotenv from 'dotenv';

dotenv.config();

const mustGet = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const optionalPositiveInt = (key: string, fallback: number): number => {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer env: ${key}`);
  }
  return parsed;
};

export const config = {
  NODE_ENV: mustGet('NODE_ENV'),
  PORT: mustGet('PORT'),
  DATABASE_URL: mustGet('DATABASE_URL'),
  REDIS_URL: mustGet('REDIS_URL'),
  jwt: {
    secret: mustGet('JWT_ACCESS_SECRET'),
    refreshSecret: mustGet('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
    refreshExpiresInDays: parseInt(
      process.env['JWT_REFRESH_EXPIRES_IN_DAYS'] ?? '7',
      10,
    ),
  },
  whatsapp: {
    accessToken: mustGet('WA_ACCESS_TOKEN'),
    phoneNumberId: mustGet('WA_PHONE_NUMBER_ID'),
    verifyToken: mustGet('WA_VERIFY_TOKEN'),
    appSecret: mustGet('WA_APP_SECRET'), // used to verify Meta's webhook signature — NOT the access token
    apiVersion: process.env['WA_API_VERSION'] ?? 'v21.0',
  },
  // AI stays optional until it is wired into a request path. The provider
  // factory validates its credentials at use time so existing deployments do
  // not fail merely because this foundation has been added.
  ai: {
    provider: process.env['AI_PROVIDER'] ?? 'openai-compatible',
    apiKey: process.env['AI_API_KEY'],
    baseUrl: process.env['AI_BASE_URL'] ?? 'https://api.openai.com/v1',
    model: process.env['AI_MODEL'] ?? 'gpt-4.1-mini',
    timeoutMs: optionalPositiveInt('AI_TIMEOUT_MS', 15_000),
  },
  SALT_ROUNDS: parseInt(mustGet('SALT_ROUNDS'), 12),
};
