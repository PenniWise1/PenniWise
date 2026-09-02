import type { User, ConversationState } from '../../generated/prisma';

export interface FlowResult {
  reply: string;
  nextState: ConversationState;
  contextPatch?: Record<string, unknown>;
  profilePatch?: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>;
}

export type FlowHandler = (
  user: User,
  messageText: string,
  interactiveReplyId?: string,
) => Promise<FlowResult>;
