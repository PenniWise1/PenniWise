import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../utils/appError';
import { AiProviderError, AiStructuredOutputError } from './ai.errors';
import { AiOrchestrator } from './ai.orchestrator';
import { AiService } from './ai.service';
import type { AiProvider } from './ai.types';

const validResult = {
  type: 'direct_response',
  message: 'PenniWise can help you understand your savings and investments.',
  intent: null,
  entities: {},
  requestedTool: null,
  confirmationRequired: false,
};

function createProvider(content: string): AiProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      id: 'completion-1',
      model: 'test-model',
      content,
      toolCalls: [],
      finishReason: 'stop',
      usage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
    }),
  };
}

function createOrchestrator(provider: AiProvider): AiOrchestrator {
  return new AiOrchestrator(new AiService(provider));
}

const validContext = {
  userId: 'application-user-1',
  conversationId: 'conversation-1',
  conversationState: 'IDLE' as const,
  recentMessages: [],
  conversationContext: {},
  metadata: { channel: 'future' },
  userMessage: 'What can PenniWise help me with?',
};

describe('AiOrchestrator', () => {
  it('returns a validated direct response and preserves application identity', async () => {
    const provider = createProvider(JSON.stringify(validResult));
    const response = await createOrchestrator(provider).respond(validContext);

    expect(response).toMatchObject({
      userId: 'application-user-1',
      conversationId: 'conversation-1',
      result: validResult,
      usage: { totalTokens: 12 },
    });
    expect(provider.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        structuredOutput: expect.objectContaining({ strict: true }),
      }),
    );
    const request = vi.mocked(provider.complete).mock.calls[0]?.[0];
    expect(request?.messages.map((message) => message.content).join(' ')).not.toContain(
      'application-user-1',
    );
  });

  it('rejects malformed JSON from the provider', async () => {
    const provider = createProvider('not-json');

    await expect(
      createOrchestrator(provider).respond(validContext),
    ).rejects.toBeInstanceOf(AiStructuredOutputError);
  });

  it('rejects structurally invalid model output', async () => {
    const provider = createProvider(
      JSON.stringify({ type: 'direct_response', message: 'Missing fields' }),
    );

    await expect(
      createOrchestrator(provider).respond(validContext),
    ).rejects.toBeInstanceOf(AiStructuredOutputError);
  });

  it('propagates safe provider failures without transforming them', async () => {
    const provider: AiProvider = {
      complete: vi.fn().mockRejectedValue(new AiProviderError()),
    };

    await expect(
      createOrchestrator(provider).respond(validContext),
    ).rejects.toBeInstanceOf(AiProviderError);
  });

  it('rejects missing required application context before calling the provider', async () => {
    const provider = createProvider(JSON.stringify(validResult));
    const incompleteContext = { ...validContext, userId: '' };

    await expect(
      createOrchestrator(provider).respond(incompleteContext),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(provider.complete).not.toHaveBeenCalled();
  });
});
