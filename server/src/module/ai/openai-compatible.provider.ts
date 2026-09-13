import logger from '../../config/logger';
import { ValidationError } from '../../utils/appError';
import {
  AiProviderConfigurationError,
  AiProviderError,
  AiProviderTimeoutError,
} from './ai.errors';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
  AiProviderConfig,
  FetchImplementation,
} from './ai.types';

interface ChatCompletionApiResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    private readonly providerConfig: AiProviderConfig,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {
    if (!providerConfig.apiKey) {
      throw new AiProviderConfigurationError('Missing env: AI_API_KEY');
    }
  }

  async complete(
    request: AiCompletionRequest,
  ): Promise<AiCompletionResponse> {
    this.validateRequest(request);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.providerConfig.timeoutMs,
    );

    try {
      const response = await this.fetchImplementation(
        `${this.providerConfig.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.providerConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.toProviderRequest(request)),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        logger.error('AI provider request failed', {
          provider: 'openai-compatible',
          status: response.status,
          model: request.model ?? this.providerConfig.model,
        });
        throw new AiProviderError();
      }

      const body = (await response.json()) as ChatCompletionApiResponse;
      return this.toCompletionResponse(body);
    } catch (error: unknown) {
      if (error instanceof AiProviderError) throw error;
      if (this.isAbortError(error)) {
        logger.warn('AI provider request timed out', {
          provider: 'openai-compatible',
          model: request.model ?? this.providerConfig.model,
        });
        throw new AiProviderTimeoutError();
      }
      logger.error('AI provider request could not be completed', {
        provider: 'openai-compatible',
        model: request.model ?? this.providerConfig.model,
      });
      throw new AiProviderError();
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateRequest(request: AiCompletionRequest): void {
    if (request.messages.length === 0) {
      throw new ValidationError('AI request must contain at least one message');
    }
    if (
      request.temperature !== undefined &&
      (!Number.isFinite(request.temperature) ||
        request.temperature < 0 ||
        request.temperature > 2)
    ) {
      throw new ValidationError('AI temperature must be between 0 and 2');
    }
  }

  private toProviderRequest(request: AiCompletionRequest): Record<string, unknown> {
    return {
      model: request.model ?? this.providerConfig.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.toolCallId !== undefined && {
          tool_call_id: message.toolCallId,
        }),
      })),
      ...(request.temperature !== undefined && {
        temperature: request.temperature,
      }),
      ...(request.tools !== undefined && {
        tools: request.tools.map((tool) => ({ type: 'function', function: tool })),
      }),
      ...(request.structuredOutput !== undefined && {
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: request.structuredOutput.name,
            schema: request.structuredOutput.schema,
            strict: request.structuredOutput.strict ?? true,
          },
        },
      }),
    };
  }

  private toCompletionResponse(body: ChatCompletionApiResponse): AiCompletionResponse {
    const choice = body.choices?.[0];
    if (!body.id || !body.model || !choice?.message) {
      logger.error('AI provider returned an invalid response', {
        provider: 'openai-compatible',
      });
      throw new AiProviderError();
    }

    return {
      id: body.id,
      model: body.model,
      content: choice.message.content ?? null,
      toolCalls: (choice.message.tool_calls ?? []).flatMap((toolCall) => {
        if (!toolCall.id || !toolCall.function?.name || !toolCall.function.arguments) {
          return [];
        }
        return [{
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        }];
      }),
      finishReason: choice.finish_reason ?? null,
      ...(body.usage !== undefined && {
        usage: {
          ...(body.usage.prompt_tokens !== undefined && {
            inputTokens: body.usage.prompt_tokens,
          }),
          ...(body.usage.completion_tokens !== undefined && {
            outputTokens: body.usage.completion_tokens,
          }),
          ...(body.usage.total_tokens !== undefined && {
            totalTokens: body.usage.total_tokens,
          }),
        },
      }),
    };
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}
