import { prisma } from '../../config/database';
import type { AdminRole } from '../../generated/prisma';

export const adminUsersRepository = {
  findByEmail(email: string) {
    return prisma.adminUser.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.adminUser.findUniqueOrThrow({ where: { id } });
  },

  list() {
    return prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  create(data: { email: string; passwordHash: string; role: AdminRole }) {
    return prisma.adminUser.create({
      data,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  deactivate(id: string) {
    return prisma.adminUser.update({
      where: { id },
      data: { isActive: false },
    });
  },

  updateAccount(id: string, data: { email?: string | undefined }) {
    return prisma.adminUser.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
      },
      select: { id: true, email: true, role: true },
    });
  },

  updatePassword(id: string, passwordHash: string) {
    return prisma.adminUser.update({ where: { id }, data: { passwordHash } });
  },
};
