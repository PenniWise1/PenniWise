import logger from '../../../config/logger';
import { ForbiddenError, ValidationError } from '../../../utils/appError';
import { AiToolExecutionError, AiToolUnavailableError } from './tool.errors';
import { aiToolRegistry } from './tool.registry';
import type { AiToolExecutionContext, AiToolRequest, AiToolResult } from './tool.types';
import { AiGuardrailService } from '../guardrails/guardrail.service';

export class AiToolExecutor {
  constructor(private readonly guardrails: AiGuardrailService = new AiGuardrailService()) {}

  async execute(
    context: AiToolExecutionContext,
    request: AiToolRequest,
  ): Promise<AiToolResult> {
    this.guardrails.assertReadToolAllowed(context);
    const tool = aiToolRegistry.get(request.name);
    if (!tool) {
      logger.warn('Rejected unknown AI tool request', { toolName: request.name });
      throw new AiToolUnavailableError();
    }

    if (tool.riskLevel !== 'LOW_RISK_READ' || tool.requiresConfirmation) {
      logger.warn('Rejected non-read AI tool request', { toolName: tool.name });
      throw new AiToolUnavailableError();
    }

    const input = tool.inputSchema.safeParse(request.arguments);
    if (!input.success) {
      logger.warn('Rejected invalid AI tool arguments', { toolName: tool.name });
      throw new ValidationError('Invalid tool arguments');
    }

    if (!context.capabilities.includes(tool.requiredCapability)) {
      logger.warn('Rejected unauthorized AI tool request', { toolName: tool.name });
      throw new ForbiddenError('Insufficient permissions');
    }

    try {
      const data = await tool.execute(context, input.data);
      logger.info('AI tool completed', {
        toolName: tool.name,
        riskLevel: tool.riskLevel,
      });
      return { toolName: tool.name, data };
    } catch (error: unknown) {
      if (error instanceof ValidationError || error instanceof ForbiddenError) {
        throw error;
      }
      logger.error('AI tool execution failed', { toolName: tool.name });
      throw new AiToolExecutionError();
    }
  }
}
