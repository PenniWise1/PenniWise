import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn() }));

vi.mock('../../config/database', () => ({
  prisma: {
    conversationMessage: { create: mocks.create, findMany: mocks.findMany },
  },
}));

import { conversationRepository } from './conversation.repository';

describe('conversationRepository.recordInboundMessageIfNew', () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.findMany.mockReset();
  });

  it('claims a new inbound message', async () => {
    mocks.create.mockResolvedValue({ id: 'message-1' });

    await expect(
      conversationRepository.recordInboundMessageIfNew({
        userId: 'user-1',
        messageType: 'text',
        content: { text: 'hello' },
        whatsappMessageId: 'wamid.1',
      }),
    ).resolves.toBe(true);
  });

  it('ignores a duplicate message ID', async () => {
    mocks.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      conversationRepository.recordInboundMessageIfNew({
        userId: 'user-1',
        messageType: 'text',
        content: { text: 'hello' },
        whatsappMessageId: 'wamid.1',
      }),
    ).resolves.toBe(false);
  });

  it('stores message content and retrieves a bounded history for memory', async () => {
    mocks.create.mockResolvedValue({ id: 'message-1' });
    await conversationRepository.logMessage({
      userId: 'user-1',
      direction: 'OUTBOUND',
      messageType: 'text',
      content: { body: 'Hello' },
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
    );

    mocks.findMany.mockResolvedValue([]);
    await conversationRepository.getRecentMessagesForMemory('user-1', 4);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' }, take: 4 }),
    );
  });
});
