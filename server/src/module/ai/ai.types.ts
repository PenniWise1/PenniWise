export type AiMessageRole = 'system' | 'developer' | 'user' | 'assistant' | 'tool';

export interface AiMessage {
  role: AiMessageRole;
  content: string;
  toolCallId?: string;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface AiStructuredOutput {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  tools?: AiToolDefinition[];
  structuredOutput?: AiStructuredOutput;
}

export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AiCompletionResponse {
  id: string;
  model: string;
  content: string | null;
  toolCalls: AiToolCall[];
  finishReason: string | null;
  usage?: AiUsage;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

export interface AiProviderConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export type FetchImplementation = typeof fetch;
