import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../generated/prisma';
import { AiConversationService } from './conversation.ai.service';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1', whatsappNumber: '2348000000000', firstName: 'Ada', lastName: null,
    email: null, status: 'ACTIVE', riskProfile: null, cscsAccountNumber: null,
    transactionPinHash: null, conversationState: 'IDLE', conversationContext: null,
    lastInteractionAt: new Date(), createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

function orchestrator(overrides: Record<string, unknown> = {}) {
  return {
    buildMemoryBackedContext: vi.fn().mockResolvedValue({
      userId: 'user-1', conversationState: 'IDLE', recentMessages: [],
      conversationContext: {}, metadata: {}, userMessage: 'Hello',
    }),
    analyzeIntent: vi.fn().mockResolvedValue({ analysis: {
      intent: 'greeting', sourceIntent: 'greeting', confidence: 0.99,
      requiresTool: false, requiresConfirmation: false, entities: {},
      missingEntities: [], requiresClarification: false,
    } }),
    respond: vi.fn().mockResolvedValue({ result: { message: 'Hello! How can I help?', type: 'direct_response' } }),
    executeTool: vi.fn(),
    prepareConfirmation: vi.fn(),
    confirmPendingAction: vi.fn(),
    ...overrides,
  };
}

describe('AiConversationService', () => {
  it('returns a natural AI response for a greeting', async () => {
    const ai = orchestrator();
    const result = await new AiConversationService(ai as never).handle(user(), 'Hello');
    expect(result).toMatchObject({ reply: 'Hello! How can I help?', nextState: 'IDLE' });
  });

  it('does not invent a balance when its service/tool is unavailable', async () => {
    const ai = orchestrator({ analyzeIntent: vi.fn().mockResolvedValue({ analysis: {
      intent: 'get_wallet_balance', sourceIntent: 'get_wallet_balance', confidence: 0.99,
      requiresTool: true, requiresConfirmation: false, entities: {}, missingEntities: [], requiresClarification: false,
    } }) });
    const result = await new AiConversationService(ai as never).handle(user(), 'What is my balance?');
    expect(result.reply).toContain('will not guess');
  });

  it('stores a trading clarification instead of guessing missing entities', async () => {
    const ai = orchestrator({ analyzeIntent: vi.fn().mockResolvedValue({ analysis: {
      intent: 'clarification_required', sourceIntent: 'place_order', confidence: 0.9,
      requiresTool: false, requiresConfirmation: false, entities: { symbol: 'GTCO' }, missingEntities: ['quantity'], requiresClarification: true,
    } }) });
    const result = await new AiConversationService(ai as never).handle(user(), 'I want to buy GTCO');
    expect(result).toMatchObject({ nextState: 'TRADING', contextPatch: { currentIntent: 'place_order' } });
    expect(result.reply).toContain('quantity');
  });

  it('creates a confirmation preview and never executes a financial tool', async () => {
    const ai = orchestrator({ analyzeIntent: vi.fn().mockResolvedValue({ analysis: {
      intent: 'place_order', sourceIntent: 'place_order', confidence: 0.99,
      requiresTool: true, requiresConfirmation: true,
      entities: { symbol: 'GTCO', quantity: 100, side: 'BUY' }, missingEntities: [], requiresClarification: false,
    } }), prepareConfirmation: vi.fn().mockResolvedValue({ id: 'a0b27f53-0829-4dd8-9ff8-06d7a89c15be' }) });
    const result = await new AiConversationService(ai as never).handle(user(), 'Buy 100 GTCO shares');
    expect(result).toMatchObject({ nextState: 'AWAITING_TRADE_CONFIRM', contextPatch: { pendingConfirmationId: 'a0b27f53-0829-4dd8-9ff8-06d7a89c15be' } });
    expect(ai.executeTool).not.toHaveBeenCalled();
  });

  it('confirms only the stored action and does not claim it executed', async () => {
    const ai = orchestrator({ confirmPendingAction: vi.fn().mockResolvedValue({ actionType: 'place_order' }) });
    const result = await new AiConversationService(ai as never).handle(
      user({ conversationState: 'AWAITING_TRADE_CONFIRM', conversationContext: { pendingConfirmationId: 'a0b27f53-0829-4dd8-9ff8-06d7a89c15be' } }),
      'Yes, confirm',
    );
    expect(ai.confirmPendingAction).toHaveBeenCalledWith('a0b27f53-0829-4dd8-9ff8-06d7a89c15be', 'user-1', 'Yes, confirm');
    expect(result.reply).toContain('has not been executed');
  });
});
