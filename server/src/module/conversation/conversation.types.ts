import type { User, ConversationState } from '../../generated/prisma';
import type { WhatsAppInboundMessage } from '../whatsapp/whatsapp.types';

export interface FlowResult {
  reply: string;
  nextState: ConversationState;
  contextPatch?: Record<string, unknown>;
  profilePatch?: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>;
}

export type FlowHandler = (
  user: User,
  message: WhatsAppInboundMessage,
) => Promise<FlowResult>;
