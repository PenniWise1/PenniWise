import logger from '../../config/logger';
import type { z } from 'zod';
import { AiStructuredOutputError } from './ai.errors';
import { AI_RESULT_JSON_SCHEMA, aiResultSchema } from './ai.result';
import type { AiResult } from './ai.result';
import type { AiMessage, AiProvider, AiUsage } from './ai.types';

export interface AiServiceResponse {
  result: AiResult;
  usage?: AiUsage;
}

export interface AiStructuredGeneration<T> {
  name: string;
  schema: Record<string, unknown>;
  validator: z.ZodType<T>;
}

export class AiService {
  constructor(private readonly provider: AiProvider) {}

  async generateStructuredResponse(
    messages: AiMessage[],
  ): Promise<AiServiceResponse> {
    return this.generateStructured(messages, {
      name: 'penniwise_response',
      schema: AI_RESULT_JSON_SCHEMA,
      validator: aiResultSchema,
    });
  }

  async generateStructured<T>(
    messages: AiMessage[],
    output: AiStructuredGeneration<T>,
  ): Promise<{ result: T; usage?: AiUsage }> {
    const response = await this.provider.complete({
      messages,
      temperature: 0.2,
      structuredOutput: {
        name: output.name,
        schema: output.schema,
        strict: true,
      },
    });

    if (!response.content) {
      logger.warn('AI provider returned an empty structured response');
      throw new AiStructuredOutputError();
    }

    try {
      const result = output.validator.parse(JSON.parse(response.content));
      return {
        result,
        ...(response.usage !== undefined && { usage: response.usage }),
      };
    } catch {
      logger.warn('AI provider returned malformed structured output');
      throw new AiStructuredOutputError();
    }
  }
}
