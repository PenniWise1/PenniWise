import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

import { config } from './env';
import logger from './logger';

const adapter = new PrismaPg(config.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.error('Database disconnected');
};
