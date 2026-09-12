import logger from '../../config/logger';
import { ValidationError } from '../../utils/appError';
import { aiOrchestrationContextSchema } from './ai.context';
import type {
  AiOrchestrationInput,
  AiOrchestrationResponse,
} from './ai.context';
import { promptManager } from './prompt-manager';
import { AiService } from './ai.service';
import { IntentParser } from './intent/intent.parser';
import type { IntentAnalysis } from './entities/entity-extractor';
import { AiToolExecutor } from './tools/tool.executor';
import type { AiToolRequest, AiToolResult } from './tools/tool.types';
import { AiGuardrailService } from './guardrails/guardrail.service';
import { ConfirmationService } from './guardrails/confirmation.service';
import type { PendingActionRecord } from './guardrails/confirmation.repository';
import { ConversationMemoryService } from '../conversation/conversation.memory';

export interface AiIntentAnalysisResponse {
  userId: string;
  conversationId?: string;
  analysis: IntentAnalysis;
}

export interface AiMemoryBackedContextInput {
  applicationUserId: string;
  userMessage: string;
  conversationId?: string;
  metadata?: Record<string, string>;
}

export class AiOrchestrator {
  private readonly intentParser: IntentParser;
  private readonly toolExecutor: AiToolExecutor;
  private readonly guardrails: AiGuardrailService;
  private readonly confirmations: ConfirmationService;
  private readonly memory: ConversationMemoryService;

  constructor(
    private readonly aiService: AiService,
    toolExecutor: AiToolExecutor = new AiToolExecutor(),
    guardrails: AiGuardrailService = new AiGuardrailService(),
    confirmations: ConfirmationService = new ConfirmationService(),
    memory: ConversationMemoryService = new ConversationMemoryService(),
  ) {
    this.intentParser = new IntentParser(aiService);
    this.toolExecutor = toolExecutor;
    this.guardrails = guardrails;
    this.confirmations = confirmations;
    this.memory = memory;
  }

  async respond(input: AiOrchestrationInput): Promise<AiOrchestrationResponse> {
    const context = this.validateContext(input);
    const messages = promptManager.buildMessages(context);
    const response = await this.aiService.generateStructuredResponse(messages);

    logger.info('AI orchestration completed', {
      conversationState: context.conversationState,
      resultType: response.result.type,
    });

    return {
      // Keep the identity from the application context, never from the model.
      userId: context.userId,
      ...(context.conversationId !== undefined && {
        conversationId: context.conversationId,
      }),
      result: response.result,
      ...(response.usage !== undefined && { usage: response.usage }),
    };
  }

  async analyzeIntent(
    input: AiOrchestrationInput,
  ): Promise<AiIntentAnalysisResponse> {
    const context = this.validateContext(input);
    const analysis = await this.intentParser.parse(context);

    logger.info('AI intent analysis completed', {
      conversationState: context.conversationState,
      intent: analysis.intent,
      requiresClarification: analysis.requiresClarification,
    });

    return {
      userId: context.userId,
      ...(context.conversationId !== undefined && {
        conversationId: context.conversationId,
      }),
      analysis,
    };
  }

  async executeTool(
    input: AiOrchestrationInput,
    request: AiToolRequest,
    capabilities: readonly string[],
  ): Promise<AiToolResult> {
    const context = this.validateContext(input);
    return this.toolExecutor.execute(
      { userId: context.userId, capabilities },
      request,
    );
  }

  async buildMemoryBackedContext(
    input: AiMemoryBackedContextInput,
  ): Promise<AiOrchestrationInput> {
    const memory = await this.memory.buildAiContext(input.applicationUserId);
    return {
      userId: input.applicationUserId,
      ...(input.conversationId !== undefined && {
        conversationId: input.conversationId,
      }),
      conversationState: memory.conversationState,
      recentMessages: memory.recentMessages,
      conversationContext: memory.conversationContext,
      metadata: input.metadata ?? {},
      userMessage: input.userMessage,
    };
  }

  async prepareConfirmation(
    input: AiOrchestrationInput,
    analysis: IntentAnalysis,
  ): Promise<PendingActionRecord> {
    const context = this.validateContext(input);
    const draft = await this.guardrails.prepareHighRiskAction(
      {
        userId: context.userId,
        conversationState: context.conversationState,
      },
      analysis,
    );
    return this.confirmations.create(draft);
  }

  async confirmPendingAction(
    actionId: string,
    applicationUserId: string,
    message: string,
  ): Promise<PendingActionRecord> {
    return this.confirmations.confirm(actionId, applicationUserId, message);
  }

  private validateContext(input: AiOrchestrationInput) {
    const parsedContext = aiOrchestrationContextSchema.safeParse(input);
    if (!parsedContext.success) {
      throw new ValidationError('Invalid AI orchestration context');
    }
    return parsedContext.data;
  }
}
