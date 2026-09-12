import { describe, expect, it } from 'vitest';
import { ForbiddenError, ValidationError } from '../../../utils/appError';
import {
  AiConfirmationExpiredError,
} from './guardrail.errors';
import { ConfirmationService } from './confirmation.service';
import type {
  ConfirmationRepository,
  PendingActionRecord,
} from './confirmation.repository';

function createRepository(record: PendingActionRecord): ConfirmationRepository {
  return {
    create: async (data) => ({
      ...record,
      userId: data.userId,
      actionType: data.actionType,
      payload: data.payload,
      expiresAt: data.expiresAt,
    }),
    findById: async () => record,
    confirmIfPending: async () => true,
    cancelIfPending: async () => true,
    expireIfPending: async () => undefined,
  };
}

const now = new Date('2026-09-10T12:00:00.000Z');
const record: PendingActionRecord = {
  id: 'action-1',
  userId: 'application-user-1',
  actionType: 'place_order',
  payload: { symbol: 'GTCO', quantity: 100, side: 'BUY' },
  status: 'PENDING',
  expiresAt: new Date('2026-09-10T12:10:00.000Z'),
  confirmedAt: null,
};

describe('ConfirmationService', () => {
  it('confirms only the exact pending action with explicit application-handled language', async () => {
    const service = new ConfirmationService(createRepository(record), () => now);
    const confirmed = await service.confirm('action-1', 'application-user-1', 'Confirm');

    expect(confirmed).toMatchObject({ id: 'action-1', status: 'CONFIRMED' });
    await expect(
      service.confirm('action-1', 'application-user-1', 'maybe'),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects confirmation mismatches and expires old actions', async () => {
    const service = new ConfirmationService(createRepository(record), () => now);
    await expect(
      service.confirm('action-1', 'another-user', 'yes'),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const expired = { ...record, expiresAt: new Date('2026-09-10T11:59:59.000Z') };
    await expect(
      new ConfirmationService(createRepository(expired), () => now).confirm(
        'action-1',
        'application-user-1',
        'yes',
      ),
    ).rejects.toBeInstanceOf(AiConfirmationExpiredError);
  });

  it('cancels only the pending action scoped to the application user', async () => {
    const cancelIfPending = async (id: string, userId: string) =>
      id === 'action-1' && userId === 'application-user-1';
    const service = new ConfirmationService({
      ...createRepository(record),
      cancelIfPending,
    }, () => now);

    await expect(service.cancel('action-1', 'application-user-1')).resolves.toBeUndefined();
  });
});
