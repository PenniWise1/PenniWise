import { getUserProfileTool } from './user-profile.tool';
import type { z } from 'zod';
import type { AiToolDefinition } from './tool.types';

const registeredTools: AiToolDefinition<z.ZodTypeAny>[] = [getUserProfileTool];

export const aiToolRegistry = {
  get(name: string): AiToolDefinition<z.ZodTypeAny> | undefined {
    return registeredTools.find((tool) => tool.name === name);
  },

  list(): readonly AiToolDefinition<z.ZodTypeAny>[] {
    return registeredTools;
  },
};

// These names are deliberately not registered: their dedicated application
// services, confirmation flow, idempotency, and audit controls do not exist yet.
export const RESERVED_HIGH_RISK_WRITE_TOOLS = [
  'deposit_money',
  'withdraw_money',
  'place_order',
  'sell_investment',
  'transfer_money',
] as const;
