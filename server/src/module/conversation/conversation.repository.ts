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

  getRecentMessages(userId: string, limit = 10) {
    return prisma.conversationMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
