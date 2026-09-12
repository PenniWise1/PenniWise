import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, ValidationError } from '../../../utils/appError';
import { AiFinancialActionNotCompletedError } from './guardrail.errors';

const mocks = vi.hoisted(() => ({ getAiUserProfile: vi.fn() }));

vi.mock('../../users/users.service', () => ({
  getAiUserProfile: mocks.getAiUserProfile,
}));

import { AiGuardrailService } from './guardrail.service';
import type { IntentAnalysis } from '../entities/entity-extractor';

const context = { userId: 'application-user-1', conversationState: 'TRADING' as const };

function analysis(overrides: Partial<IntentAnalysis> = {}): IntentAnalysis {
  return {
    intent: 'place_order',
    confidence: 0.99,
    requiresTool: true,
    requiresConfirmation: true,
    entities: { symbol: 'GTCO', quantity: 100, side: 'BUY' },
    missingEntities: [],
    requiresClarification: false,
    ...overrides,
  };
}

describe('AiGuardrailService', () => {
  beforeEach(() => {
    mocks.getAiUserProfile.mockReset();
    mocks.getAiUserProfile.mockResolvedValue({ status: 'ACTIVE' });
  });

  it('prepares but never executes a valid high-risk action', async () => {
    const draft = await new AiGuardrailService().prepareHighRiskAction(
      context,
      analysis(),
    );

    expect(draft).toEqual({
      userId: 'application-user-1',
      actionType: 'place_order',
      payload: { symbol: 'GTCO', quantity: 100, side: 'BUY' },
    });
  });

  it('rejects missing entities, invalid amounts, and missing confirmation policy', async () => {
    const service = new AiGuardrailService();
    await expect(
      service.prepareHighRiskAction(context, analysis({ missingEntities: ['symbol'] })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.prepareHighRiskAction(
        { ...context, conversationState: 'IDLE' },
        analysis({
          intent: 'transfer_money',
          entities: { amount: -20, beneficiaryName: 'John' },
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.prepareHighRiskAction(context, analysis({ requiresConfirmation: false })),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects ineligible users and invalid conversation state', async () => {
    mocks.getAiUserProfile.mockResolvedValue({ status: 'PENDING_KYC' });
    await expect(
      new AiGuardrailService().prepareHighRiskAction(context, analysis()),
    ).rejects.toBeInstanceOf(ForbiddenError);

    mocks.getAiUserProfile.mockResolvedValue({ status: 'ACTIVE' });
    await expect(
      new AiGuardrailService().prepareHighRiskAction(
        { ...context, conversationState: 'ONBOARDING' },
        analysis(),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('does not permit an AI success claim when the service result is not completed', () => {
    const service = new AiGuardrailService();
    expect(() => service.assertFinancialServiceCompleted({ status: 'FAILED' })).toThrow(
      AiFinancialActionNotCompletedError,
    );
    expect(() => service.assertFinancialServiceCompleted({ status: 'COMPLETED' })).not.toThrow();
  });

  it('does not let a prompt-injection request bypass confirmation', async () => {
    await expect(
      new AiGuardrailService().prepareHighRiskAction(
        context,
        analysis({ requiresConfirmation: false }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
