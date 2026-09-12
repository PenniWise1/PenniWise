import type { User, ConversationState } from '../../generated/prisma';
import type { ConversationContext } from './conversation.context';

export interface FlowResult {
  reply: string;
  nextState: ConversationState;
  contextPatch?: ConversationContext;
  clearContext?: boolean;
  profilePatch?: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>;
}

export type FlowHandler = (
  user: User,
  messageText: string,
  interactiveReplyId?: string,
) => Promise<FlowResult>;
