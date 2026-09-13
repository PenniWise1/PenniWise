import { AiProviderError, AiProviderTimeoutError } from '../ai/ai.errors';
import { AiOrchestrator } from '../ai/ai.orchestrator';
import type { IntentAnalysis } from '../ai/entities/entity-extractor';
import { AiToolExecutionError, AiToolUnavailableError } from '../ai/tools/tool.errors';
import { readConversationContext } from './conversation.context';
import type { FlowResult } from './conversation.types';
import type { User } from '../../generated/prisma';

const PROFILE_CAPABILITY = 'profile:read';

export interface AiConversationCoordinator {
  handle(user: User, messageText: string): Promise<FlowResult>;
}

export class AiConversationService implements AiConversationCoordinator {
  constructor(private readonly orchestrator: AiOrchestrator) {}

  async handle(user: User, messageText: string): Promise<FlowResult> {
    const storedContext = readConversationContext(user.conversationContext);
    if (storedContext.pendingConfirmationId) {
      return this.handleConfirmation(user, messageText, storedContext.pendingConfirmationId);
    }

    const context = await this.orchestrator.buildMemoryBackedContext({
      applicationUserId: user.id,
      userMessage: messageText,
      metadata: { channel: 'whatsapp' },
    });
    const { analysis } = await this.orchestrator.analyzeIntent(context);

    if (analysis.requiresClarification) {
      return this.clarificationResult(analysis);
    }

    if (analysis.requiresConfirmation) {
      const pending = await this.orchestrator.prepareConfirmation(context, analysis);
      return {
        reply: this.confirmationPreview(analysis),
        nextState: analysis.sourceIntent === 'place_order' || analysis.sourceIntent === 'sell_investment'
          ? 'AWAITING_TRADE_CONFIRM'
          : 'IDLE',
        contextPatch: {
          currentIntent: analysis.sourceIntent,
          entities: analysis.entities,
          pendingConfirmationId: pending.id,
        },
      };
    }

    if (analysis.requiresTool) {
      return this.handleReadIntent(user, context, analysis);
    }

    const response = await this.orchestrator.respond(context);
    return {
      reply: response.result.message,
      nextState: user.conversationState,
      contextPatch: { currentIntent: analysis.intent, entities: analysis.entities },
    };
  }

  private async handleReadIntent(
    user: User,
    context: Awaited<ReturnType<AiOrchestrator['buildMemoryBackedContext']>>,
    analysis: IntentAnalysis,
  ): Promise<FlowResult> {
    if (analysis.intent !== 'get_user_profile') {
      return {
        reply: 'I cannot retrieve verified information for that request yet. I will not guess or invent account data.',
        nextState: user.conversationState,
      };
    }

    try {
      const result = await this.orchestrator.executeTool(
        context,
        { name: 'get_user_profile', arguments: {} },
        [PROFILE_CAPABILITY],
      );
      const profile = result.data['profile'] as {
        firstName: string | null;
        lastName: string | null;
        status: string;
        riskProfile: string | null;
      };
      return {
        reply: [
          `Profile: ${[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'not completed'}.`,
          `Account status: ${profile.status}.`,
          ...(profile.riskProfile ? [`Risk profile: ${profile.riskProfile}.`] : []),
        ].join(' '),
        nextState: user.conversationState,
      };
    } catch (error) {
      if (error instanceof AiToolUnavailableError || error instanceof AiToolExecutionError) {
        return { reply: 'I could not retrieve that verified information right now.', nextState: user.conversationState };
      }
      throw error;
    }
  }

  private clarificationResult(analysis: IntentAnalysis): FlowResult {
    const missing = analysis.missingEntities.join(' and ');
    const trading = analysis.sourceIntent === 'place_order' || analysis.sourceIntent === 'sell_investment';
    return {
      reply: missing
        ? `To continue, please provide the ${missing.replace(/([A-Z])/g, ' $1').toLowerCase()}.`
        : 'Could you clarify what you would like to do?',
      nextState: trading ? 'TRADING' : analysis.sourceIntent === 'create_savings_goal' ? 'SAVING' : 'IDLE',
      contextPatch: {
        currentIntent: analysis.sourceIntent,
        entities: analysis.entities,
        pendingClarification: {
          intent: analysis.sourceIntent,
          missingEntities: analysis.missingEntities,
        },
      },
    };
  }

  private async handleConfirmation(
    user: User,
    messageText: string,
    actionId: string,
  ): Promise<FlowResult> {
    try {
      const action = await this.orchestrator.confirmPendingAction(actionId, user.id, messageText);
      return {
        reply: `Your ${action.actionType.replace(/_/g, ' ')} was confirmed. It has not been executed because the required financial service is not available yet.`,
        nextState: 'IDLE',
        clearContext: true,
      };
    } catch (error) {
      if (error instanceof AiProviderError || error instanceof AiProviderTimeoutError) throw error;
      return {
        reply: 'That confirmation could not be completed. Reply "confirm" only for the pending action, or "restart" to cancel.',
        nextState: user.conversationState,
      };
    }
  }

  private confirmationPreview(analysis: IntentAnalysis): string {
    const entities = analysis.entities;
    if (analysis.sourceIntent === 'place_order' || analysis.sourceIntent === 'sell_investment') {
      return `You are about to ${entities.side === 'SELL' ? 'sell' : 'buy'} ${entities.quantity} shares of ${entities.symbol}. Reply "confirm" to continue or "restart" to cancel.`;
    }
    return `You are about to ${analysis.sourceIntent.replace(/_/g, ' ')}. Reply "confirm" to continue or "restart" to cancel.`;
  }
}
