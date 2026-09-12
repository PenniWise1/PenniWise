import logger from '../../../config/logger';
import { ForbiddenError, ValidationError } from '../../../utils/appError';
import * as usersService from '../../users/users.service';
import type { IntentAnalysis } from '../entities/entity-extractor';
import type { AiToolExecutionContext } from '../tools/tool.types';
import {
  AiFinancialActionNotCompletedError,
} from './guardrail.errors';
import {
  highRiskPayloadSchemas,
  isHighRiskIntent,
} from './guardrail.types';
import type {
  FinancialServiceResult,
  GuardrailContext,
  PendingActionDraft,
} from './guardrail.types';

const ACTION_STATES: Record<string, readonly string[]> = {
  deposit_money: ['IDLE'],
  withdraw_money: ['IDLE'],
  transfer_money: ['IDLE'],
  place_order: ['IDLE', 'TRADING'],
  sell_investment: ['IDLE', 'TRADING'],
};

export class AiGuardrailService {
  assertReadToolAllowed(context: AiToolExecutionContext): void {
    if (!context.userId.trim()) {
      throw new ValidationError('Missing application user identity');
    }
  }

  async prepareHighRiskAction(
    context: GuardrailContext,
    analysis: IntentAnalysis,
  ): Promise<PendingActionDraft> {
    if (!context.userId.trim()) {
      throw new ValidationError('Missing application user identity');
    }
    if (!isHighRiskIntent(analysis.intent)) {
      throw new ValidationError('Intent is not a high-risk financial action');
    }
    if (analysis.requiresClarification || analysis.missingEntities.length > 0) {
      throw new ValidationError('Financial action is missing required information');
    }
    if (!analysis.requiresConfirmation) {
      throw new ValidationError('Financial action requires explicit confirmation');
    }
    if (!ACTION_STATES[analysis.intent]?.includes(context.conversationState)) {
      throw new ValidationError('Financial action is not allowed in this conversation state');
    }

    const profile = await usersService.getAiUserProfile(context.userId);
    if (profile.status !== 'ACTIVE') {
      logger.warn('Rejected financial action for ineligible user', {
        actionType: analysis.intent,
      });
      throw new ForbiddenError('Account is not eligible for this operation');
    }

    const payload = highRiskPayloadSchemas[analysis.intent].safeParse(
      analysis.entities,
    );
    if (!payload.success) {
      throw new ValidationError('Invalid financial action parameters');
    }

    return {
      userId: context.userId,
      actionType: analysis.intent,
      payload: payload.data,
    };
  }

  assertFinancialServiceCompleted(result: FinancialServiceResult): void {
    if (result.status !== 'COMPLETED') {
      throw new AiFinancialActionNotCompletedError();
    }
  }
}
