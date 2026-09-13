import { describe, expect, it } from 'vitest';
import {
  mergeConversationContext,
  readConversationContext,
} from './conversation.context';

describe('conversation context', () => {
  it('drops unexpected durable fields rather than persisting them', () => {
    expect(
      readConversationContext({
        firstName: 'Ada',
        pendingTransfer: { amount: 50000 },
      }),
    ).toEqual({});
  });

  it('merges only the supported onboarding context', () => {
    expect(mergeConversationContext({}, { firstName: 'Ada' })).toEqual({
      firstName: 'Ada',
    });
  });
});
