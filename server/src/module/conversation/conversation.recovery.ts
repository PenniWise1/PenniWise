import type { User } from '../../generated/prisma';

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function isSessionStale(user: User): boolean {
  if (user.conversationState === 'IDLE') return false; // nothing to resume
  if (!user.lastInteractionAt) return false;
  return Date.now() - user.lastInteractionAt.getTime() > STALE_THRESHOLD_MS;
}

export function buildResumePrompt(user: User): string {
  const readableState = user.conversationState.replace(/_/g, ' ').toLowerCase();
  return [
    `Welcome back! You were in the middle of something (${readableState}).`,
    `Reply "restart" to start over, or just continue and I'll pick up where we left off.`,
  ].join(' ');
}

export function safeFallbackState(): { reply: string; nextState: 'IDLE' } {
  return {
    reply: `Sorry, something went wrong on our end. Let's start over — what would you like to do?`,
    nextState: 'IDLE',
  };
}
