import type { Prisma, User } from '../../generated/prisma';
import { NotFoundError } from '../../utils/appError';
import { conversationRepository } from './conversation.repository';
import {
  mergeConversationContext,
  readConversationContext,
} from './conversation.context';
import { isSessionStale } from './conversation.recovery';
import { usersRepository } from '../users/users.repository';
import type { ConversationContext } from './conversation.context';

type MemoryMessage = {
  direction: 'INBOUND' | 'OUTBOUND';
  content: Prisma.JsonValue;
  createdAt: Date;
};

interface MemoryConversationRepository {
  getRecentMessagesForMemory(userId: string, limit: number): Promise<MemoryMessage[]>;
}

interface MemoryUsersRepository {
  findById(id: string): Promise<User | null>;
  updateConversationState(
    id: string,
    state: User['conversationState'],
    context?: Prisma.InputJsonValue,
  ): Promise<User>;
}

export interface ConversationMemory {
  conversationState: User['conversationState'];
  context: ConversationContext;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isStale: boolean;
}

function extractSafeText(content: Prisma.JsonValue): string | null {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }
  const record = content as Record<string, Prisma.JsonValue>;
  const directBody = record['body'];
  if (typeof directBody === 'string') return directBody.trim().slice(0, 2_000);

  const text = record['text'];
  if (text && typeof text === 'object' && !Array.isArray(text)) {
    const body = (text as Record<string, Prisma.JsonValue>)['body'];
    if (typeof body === 'string') return body.trim().slice(0, 2_000);
  }
  return null;
}

function toPromptContext(context: ConversationContext): Record<string, string> {
  return {
    ...(context.firstName !== undefined && { firstName: context.firstName }),
    ...(context.currentIntent !== undefined && {
      currentIntent: context.currentIntent,
    }),
    ...(context.entities !== undefined && {
      entities: JSON.stringify(context.entities),
    }),
    ...(context.pendingClarification !== undefined && {
      pendingClarification: JSON.stringify(context.pendingClarification),
    }),
  };
}

export class ConversationMemoryService {
  constructor(
    private readonly messages: MemoryConversationRepository = conversationRepository,
    private readonly users: MemoryUsersRepository = usersRepository,
  ) {}

  async build(userId: string, limit = 8): Promise<ConversationMemory> {
    const user = await this.requireUser(userId);
    const stale = isSessionStale(user);
    const storedMessages = stale
      ? []
      : await this.messages.getRecentMessagesForMemory(user.id, limit);

    return {
      conversationState: user.conversationState,
      context: readConversationContext(user.conversationContext),
      recentMessages: storedMessages
        .slice()
        .reverse()
        .flatMap((message) => {
          const content = extractSafeText(message.content);
          if (!content) return [];
          return [
            {
              role: (message.direction === 'INBOUND' ? 'user' : 'assistant') as
                | 'user'
                | 'assistant',
              content,
            },
          ];
        }),
      isStale: stale,
    };
  }

  async buildAiContext(userId: string, limit = 8) {
    const memory = await this.build(userId, limit);
    return {
      conversationState: memory.conversationState,
      recentMessages: memory.recentMessages,
      conversationContext: toPromptContext(memory.context),
      isStale: memory.isStale,
    };
  }

  async updateContext(
    userId: string,
    patch: ConversationContext,
  ): Promise<ConversationContext> {
    const user = await this.requireUser(userId);
    const context = mergeConversationContext(user.conversationContext, patch);
    await this.users.updateConversationState(
      user.id,
      user.conversationState,
      context as Prisma.InputJsonValue,
    );
    return context;
  }

  async clearContext(
    userId: string,
    preservePendingConfirmation = true,
  ): Promise<ConversationContext> {
    const user = await this.requireUser(userId);
    const current = readConversationContext(user.conversationContext);
    const context =
      preservePendingConfirmation && current.pendingConfirmationId
        ? { pendingConfirmationId: current.pendingConfirmationId }
        : {};
    await this.users.updateConversationState(
      user.id,
      user.conversationState,
      context as Prisma.InputJsonValue,
    );
    return context;
  }

  async setPendingConfirmation(
    userId: string,
    pendingConfirmationId: string,
  ): Promise<ConversationContext> {
    return this.updateContext(userId, { pendingConfirmationId });
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
