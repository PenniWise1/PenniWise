import { authRepository } from '../auth/auth.repository';
import { NotFoundError, ForbiddenError } from '../../utils/appError';
import logger from '../../config/logger';

export async function listSessions(adminId: string) {
  const sessions = await authRepository.listActiveSessions(adminId);
  return sessions.map(({ refreshTokenHash, ...safe }) => safe);
}

export async function revokeSession(adminId: string, sessionId: string) {
  const session = await authRepository.findSessionById(sessionId);
  if (!session) {
    logger.warn(
      `Attempt to revoke non-existent session ${sessionId} by admin ${adminId}`,
    );
    throw new NotFoundError('Session not found');
  }
  if (session.adminId !== adminId) {
    logger.warn(
      `Unauthorized attempt to revoke session ${sessionId} by admin ${adminId}`,
    );
    throw new ForbiddenError();
  }
  await authRepository.revokeSession(sessionId);
  logger.info(`Session ${sessionId} revoked by admin ${adminId}`);
}
