import dotenv from 'dotenv';

dotenv.config();

const mustGet = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
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
  SALT_ROUNDS: parseInt(mustGet('SALT_ROUNDS'), 12),
};
