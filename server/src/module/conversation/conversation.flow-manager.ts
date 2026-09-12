import type { Prisma } from '../../generated/prisma';
import logger from '../../config/logger';
import { usersRepository } from '../users/users.repository';
import { conversationRepository } from './conversation.repository';
import { FLOW_REGISTRY } from './flows';
import { assertTransition } from './conversation.state-machine';
import {
  isSessionStale,
  buildResumePrompt,
  safeFallbackState,
} from './conversation.recovery';
import { mergeConversationContext } from './conversation.context';
import { readConversationContext } from './conversation.context';
import * as whatsappService from '../whatsapp/whatsapp.service';
import type { WhatsAppInboundMessage } from '../whatsapp/whatsapp.types';
import { createAiProvider } from '../ai/ai.provider';
import { AiService } from '../ai/ai.service';
import { AiOrchestrator } from '../ai/ai.orchestrator';
import {
  AiConversationService,
  type AiConversationCoordinator,
} from './conversation.ai.service';
import { ConfirmationService } from '../ai/guardrails/confirmation.service';

const RESTART_KEYWORD = 'restart';

let aiConversationCoordinator: AiConversationCoordinator | undefined;

function getAiConversationCoordinator(): AiConversationCoordinator {
  aiConversationCoordinator ??= new AiConversationService(
    new AiOrchestrator(new AiService(createAiProvider())),
  );
  return aiConversationCoordinator;
}

// Used only by integration tests to keep external AI calls mocked.
export function setAiConversationCoordinatorForTests(
  coordinator: AiConversationCoordinator | undefined,
): void {
  aiConversationCoordinator = coordinator;
}

export async function handleInboundMessage(
  message: WhatsAppInboundMessage,
): Promise<void> {
  logger.info(`Incoming WhatsApp message received`, { type: message.type });
  const user = await usersRepository.findOrCreate(message.from);

  const messageText =
    message.text?.body ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    '';

  const isNewMessage = await conversationRepository.recordInboundMessageIfNew({
    userId: user.id,
    messageType: message.type,
    content: message as unknown as Prisma.InputJsonValue,
    whatsappMessageId: message.id,
  });

  if (!isNewMessage) {
    logger.warn('Ignored duplicate WhatsApp message', { messageId: message.id });
    return;
  }

  // Keep the previous timestamp for stale detection, then record this inbound
  // message regardless of which supported flow handles it.
  await usersRepository.touchLastInteraction(user.id);

  if (messageText.trim().toLowerCase() === RESTART_KEYWORD) {
    assertTransition(user.conversationState, 'IDLE');
    const pendingConfirmationId = readConversationContext(
      user.conversationContext,
    ).pendingConfirmationId;
    if (pendingConfirmationId) {
      await new ConfirmationService().cancel(pendingConfirmationId, user.id);
    }
    await usersRepository.updateConversationState(user.id, 'IDLE', {});
    await sendReply(
      user.id,
      message.from,
      `No problem, let's start fresh. What would you like to do?`,
    );
    return;
  }

  if (isSessionStale(user)) {
    await sendReply(user.id, message.from, buildResumePrompt(user));
    return;
  }

  const handler = FLOW_REGISTRY[user.conversationState];
  const shouldUseAi =
    user.conversationState !== 'ONBOARDING' &&
    !(user.status === 'PENDING_KYC' && !user.firstName);

  if (!handler && !shouldUseAi) {
    // A state exists in the schema for a phase that isn't built yet.
    // Explain and reset, rather than the bot going silent.
    assertTransition(user.conversationState, 'IDLE');
    await usersRepository.updateConversationState(user.id, 'IDLE', {});
    await sendReply(
      user.id,
      message.from,
      `That part of Penniwise isn't available yet — here's the main menu instead.`,
    );
    return;
  }

  try {
    const interactiveReplyId =
      message.interactive?.button_reply?.id ??
      message.interactive?.list_reply?.id;
    const result = shouldUseAi
      ? await getAiConversationCoordinator().handle(user, messageText)
      : await handler!(user, messageText, interactiveReplyId);

    logger.info('Conversation state transition', {
      from: user.conversationState,
      to: result.nextState,
    });
    assertTransition(user.conversationState, result.nextState);

    const mergedContext = result.clearContext
      ? {}
      : mergeConversationContext(user.conversationContext, result.contextPatch ?? {});

    await usersRepository.updateConversationState(
      user.id,
      result.nextState,
      mergedContext as Prisma.InputJsonValue,
    );
    if (result.profilePatch) {
      await usersRepository.updateProfile(user.id, result.profilePatch);
    }

    await sendReply(user.id, message.from, result.reply);
  } catch (err) {
    logger.error(
      `Flow handler error for user ${user.id} in state ${user.conversationState}:`,
      err,
    );
    const fallback = safeFallbackState();
    await usersRepository.updateConversationState(
      user.id,
      fallback.nextState,
      {},
    );
    await sendReply(user.id, message.from, fallback.reply);
  }
}

async function sendReply(
  userId: string,
  whatsappNumber: string,
  replyText: string,
) {
  await whatsappService.sendTextMessage(whatsappNumber, replyText);
  await conversationRepository.logMessage({
    userId,
    direction: 'OUTBOUND',
    messageType: 'text',
    content: { body: replyText },
  });
}
