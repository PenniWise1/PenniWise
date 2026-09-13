import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../generated/prisma';
import { ConversationMemoryService } from './conversation.memory';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'application-user-1',
    whatsappNumber: '2348000000000',
    firstName: 'Ada',
    lastName: null,
    email: null,
    status: 'ACTIVE',
    riskProfile: null,
    cscsAccountNumber: null,
    transactionPinHash: null,
    conversationState: 'TRADING',
    conversationContext: {
      currentIntent: 'place_order',
      entities: { symbol: 'GTCO' },
      pendingConfirmationId: 'b6b6983e-34dd-4c07-86b2-0c3f55844fd5',
    },
    lastInteractionAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createService(user = makeUser()) {
  const messages = {
    getRecentMessagesForMemory: vi.fn().mockResolvedValue([
      {
        direction: 'OUTBOUND' as const,
        content: { body: 'How many shares would you like?' },
        createdAt: new Date('2026-09-10T11:58:00.000Z'),
      },
      {
        direction: 'INBOUND' as const,
        content: { text: { body: 'I want to buy GTCO.' } },
        createdAt: new Date('2026-09-10T11:57:00.000Z'),
      },
    ]),
  };
  const users = {
    findById: vi.fn().mockResolvedValue(user),
    updateConversationState: vi.fn().mockResolvedValue(user),
  };
  return { service: new ConversationMemoryService(messages, users), messages, users };
}

describe('ConversationMemoryService', () => {
  it('builds a bounded chronological multi-turn context from the owning user history', async () => {
    const { service, messages } = createService();
    const memory = await service.build('application-user-1', 2);

    expect(messages.getRecentMessagesForMemory).toHaveBeenCalledWith(
      'application-user-1',
      2,
    );
    expect(memory.recentMessages).toEqual([
      { role: 'user', content: 'I want to buy GTCO.' },
      { role: 'assistant', content: 'How many shares would you like?' },
    ]);
    expect(memory.context.entities).toEqual({ symbol: 'GTCO' });
  });

  it('does not mix memory from a different application user', async () => {
    const { service, messages, users } = createService(makeUser({ id: 'user-a' }));
    await service.build('user-a');

    expect(users.findById).toHaveBeenCalledWith('user-a');
    expect(messages.getRecentMessagesForMemory).toHaveBeenCalledWith('user-a', 8);
  });

  it('does not send stale history to AI context', async () => {
    const staleUser = makeUser({
      conversationState: 'TRADING',
      lastInteractionAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    const { service, messages } = createService(staleUser);
    const memory = await service.buildAiContext('application-user-1');

    expect(memory.isStale).toBe(true);
    expect(memory.recentMessages).toEqual([]);
    expect(messages.getRecentMessagesForMemory).not.toHaveBeenCalled();
  });

  it('updates safe structured context and preserves a pending confirmation on reset', async () => {
    const { service, users } = createService();
    const updated = await service.updateContext('application-user-1', {
      pendingClarification: {
        intent: 'place_order',
        missingEntities: ['quantity'],
      },
    });
    expect(updated.pendingClarification?.missingEntities).toEqual(['quantity']);

    const reset = await service.clearContext('application-user-1');
    expect(reset).toEqual({
      pendingConfirmationId: 'b6b6983e-34dd-4c07-86b2-0c3f55844fd5',
    });
    expect(users.updateConversationState).toHaveBeenCalled();
  });

  it('does not accept secrets or raw financial action payloads in memory context', async () => {
    const { service } = createService();
    await expect(
      service.updateContext('application-user-1', {
        transactionPin: '1234',
      } as never),
    ).rejects.toThrow();
  });
});
