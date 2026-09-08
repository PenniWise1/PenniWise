import { prisma } from '../../config/database';
import type { KycType, Prisma } from '../../generated/prisma';

export const kycRepository = {
  findLatestByType(userId: string, type: KycType) {
    return prisma.kycVerification.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
  },

  listForUser(userId: string) {
    return prisma.kycVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  create(data: Prisma.KycVerificationUncheckedCreateInput) {
    return prisma.kycVerification.create({ data });
  },
};
