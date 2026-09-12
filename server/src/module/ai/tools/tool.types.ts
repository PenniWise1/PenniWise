import type { z } from 'zod';

export const AI_TOOL_RISK_LEVELS = ['LOW_RISK_READ', 'HIGH_RISK_WRITE'] as const;
export type AiToolRiskLevel = (typeof AI_TOOL_RISK_LEVELS)[number];

export interface AiToolExecutionContext {
  // Resolved by the application; never sourced from model-generated arguments.
  userId: string;
  capabilities: readonly string[];
}

export interface AiToolRequest {
  name: string;
  arguments: unknown;
}

export interface AiToolResult {
  toolName: string;
  data: Record<string, unknown>;
}

export interface AiToolDefinition<TInput extends z.ZodType> {
  name: string;
  description: string;
  inputSchema: TInput;
  riskLevel: AiToolRiskLevel;
  requiresConfirmation: boolean;
  requiredCapability: string;
  execute(
    context: AiToolExecutionContext,
    input: z.infer<TInput>,
  ): Promise<Record<string, unknown>>;
}
