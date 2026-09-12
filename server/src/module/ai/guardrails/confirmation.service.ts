import logger from '../../../config/logger';
import type { Prisma } from '../../../generated/prisma';
import { ForbiddenError, ValidationError } from '../../../utils/appError';
import {
  AiConfirmationExpiredError,
  AiConfirmationUnavailableError,
} from './guardrail.errors';
import type { ConfirmationRepository, PendingActionRecord } from './confirmation.repository';
import { confirmationRepository } from './confirmation.repository';
import type { PendingActionDraft } from './guardrail.types';

const DEFAULT_CONFIRMATION_TTL_MS = 10 * 60 * 1000;
const CONFIRMATION_WORDS = new Set(['confirm', 'yes', 'proceed', 'yes confirm']);

export class ConfirmationService {
  constructor(
    private readonly repository: ConfirmationRepository = confirmationRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly ttlMs = DEFAULT_CONFIRMATION_TTL_MS,
  ) {}

  async create(draft: PendingActionDraft): Promise<PendingActionRecord> {
    const now = this.now();
    const expiresAt = new Date(now.getTime() + this.ttlMs);
    const action = await this.repository.create({
      userId: draft.userId,
      actionType: draft.actionType,
      payload: draft.payload as Prisma.InputJsonValue,
      expiresAt,
    });
    logger.info('Created pending AI confirmation', { actionType: draft.actionType });
    return action;
  }

  async confirm(
    actionId: string,
    applicationUserId: string,
    message: string,
  ): Promise<PendingActionRecord> {
    if (!isExplicitConfirmation(message)) {
      throw new ValidationError('Explicit confirmation is required');
    }

    const action = await this.repository.findById(actionId);
    if (!action) throw new AiConfirmationUnavailableError();
    if (action.userId !== applicationUserId) {
      throw new ForbiddenError('This confirmation belongs to another user');
    }
    const now = this.now();
    if (action.expiresAt <= now) {
      await this.repository.expireIfPending(action.id, now);
      throw new AiConfirmationExpiredError();
    }

    const confirmed = await this.repository.confirmIfPending(
      action.id,
      applicationUserId,
      now,
    );
    if (!confirmed) throw new AiConfirmationUnavailableError();

    logger.info('Confirmed pending AI action', { actionType: action.actionType });
    return { ...action, status: 'CONFIRMED', confirmedAt: now };
  }

  async cancel(actionId: string, applicationUserId: string): Promise<void> {
    await this.repository.cancelIfPending(actionId, applicationUserId);
    logger.info('Cancelled pending AI confirmation');
  }
}

export function isExplicitConfirmation(message: string): boolean {
  return CONFIRMATION_WORDS.has(
    message.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' '),
  );
}
