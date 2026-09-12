import { prisma } from '../../../config/database';
import type { Prisma, PendingAiActionStatus } from '../../../generated/prisma';

export interface PendingActionRecord {
  id: string;
  userId: string;
  actionType: string;
  payload: unknown;
  status: PendingAiActionStatus;
  expiresAt: Date;
  confirmedAt: Date | null;
}

export interface ConfirmationRepository {
  create(data: {
    userId: string;
    actionType: string;
    payload: Prisma.InputJsonValue;
    expiresAt: Date;
  }): Promise<PendingActionRecord>;
  findById(id: string): Promise<PendingActionRecord | null>;
  confirmIfPending(id: string, userId: string, now: Date): Promise<boolean>;
  cancelIfPending(id: string, userId: string): Promise<boolean>;
  expireIfPending(id: string, now: Date): Promise<void>;
}

export const confirmationRepository: ConfirmationRepository = {
  create(data) {
    return prisma.pendingAiAction.create({ data });
  },

  findById(id) {
    return prisma.pendingAiAction.findUnique({ where: { id } });
  },

  async confirmIfPending(id, userId, now) {
    const update = await prisma.pendingAiAction.updateMany({
      where: { id, userId, status: 'PENDING', expiresAt: { gt: now } },
      data: { status: 'CONFIRMED', confirmedAt: now },
    });
    return update.count === 1;
  },

  async cancelIfPending(id, userId) {
    const update = await prisma.pendingAiAction.updateMany({
      where: { id, userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    return update.count === 1;
  },

  async expireIfPending(id, now) {
    await prisma.pendingAiAction.updateMany({
      where: { id, status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
  },
};
