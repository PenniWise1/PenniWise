import { z } from 'zod';
import * as usersService from '../../users/users.service';
import type { AiToolDefinition } from './tool.types';

const inputSchema = z.object({}).strict();

export const getUserProfileTool: AiToolDefinition<typeof inputSchema> = {
  name: 'get_user_profile',
  description: 'Returns the authenticated PenniWise user profile.',
  inputSchema,
  riskLevel: 'LOW_RISK_READ',
  requiresConfirmation: false,
  requiredCapability: 'profile:read',
  async execute(context) {
    const profile = await usersService.getAiUserProfile(context.userId);
    return { profile };
  },
};
