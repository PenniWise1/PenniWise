import { prisma } from '../../config/database';
import type { MessageDirection, Prisma } from '../../generated/prisma';

export const conversationRepository = {
  logMessage(data: {
    userId: string;
    direction: MessageDirection;
    messageType: string;
    content: Prisma.InputJsonValue;
    whatsappMessageId?: string;
  }) {
    return prisma.conversationMessage.create({ data });
  },

  async recordInboundMessageIfNew(data: {
    userId: string;
    messageType: string;
    content: Prisma.InputJsonValue;
    whatsappMessageId: string;
  }): Promise<boolean> {
    try {
      await prisma.conversationMessage.create({
        data: { ...data, direction: 'INBOUND' },
      });
      return true;
    } catch (error: unknown) {
      // The database unique index is the race-safe replay guard.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  },

  getRecentMessages(userId: string, limit = 10) {
    return prisma.conversationMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  getRecentMessagesForMemory(userId: string, limit = 8) {
    return prisma.conversationMessage.findMany({
      where: { userId },
      select: { direction: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
