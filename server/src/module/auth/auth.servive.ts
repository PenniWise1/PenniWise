import { randomUUID } from 'crypto';
import { config } from '../../config/env';
import logger from '../../config/logger';
import { authRepository } from './auth.repository';
import { comparePassword } from '../../utils/password';
import { hashToken } from '../../utils/crypto';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/appError';
import type { LoginInput } from './auth.validation';

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

function sessionExpiry(): Date {
  return new Date(
    Date.now() + config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  );
}

export async function login(input: LoginInput, meta: RequestMeta) {
  const admin = await authRepository.findAdminByEmail(input.email);
  if (
    !admin ||
    !admin.isActive ||
    !(await comparePassword(input.password, admin.passwordHash))
  ) {
    logger.warn(`Failed login attempt for email: ${input.email}`);
    throw new UnauthorizedError('Invalid credentials');
  }

  const sessionId = randomUUID();
  const refreshToken = signRefreshToken({ sid: sessionId });

  await authRepository.createSession({
    id: sessionId,
    adminId: admin.id,
    refreshTokenHash: hashToken(refreshToken),
    ...(meta.userAgent !== undefined && { userAgent: meta.userAgent }),
    ...(meta.ipAddress !== undefined && { ipAddress: meta.ipAddress }),
    expiresAt: sessionExpiry(),
  });
  await authRepository.touchLastLogin(admin.id);

  const accessToken = signAccessToken({
    sub: admin.id,
    role: admin.role,
    sid: sessionId,
  });
  const { passwordHash, ...safeAdmin } = admin;
  logger.info(`Admin logged in: ${admin.id}`, {
    email: admin.email,
    ipAddress: meta.ipAddress,
  });
  return { admin: safeAdmin, accessToken, refreshToken };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    logger.warn('Invalid or expired refresh token attempted');
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const session = await authRepository.findSessionById(payload.sid);
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    logger.warn(`Session no longer valid for session ID: ${payload.sid}`);
    throw new UnauthorizedError('Session no longer valid');
  }
  if (hashToken(refreshToken) !== session.refreshTokenHash) {
    await authRepository.revokeSession(session.id);
    logger.warn(`Refresh token reuse detected — session ${session.id} revoked`);
    throw new UnauthorizedError(
      'Refresh token reuse detected — session revoked',
    );
  }

  const admin = await authRepository.findAdminById(session.adminId);
  if (!admin || !admin.isActive) {
    throw new UnauthorizedError('Account no longer active');
  }

  // Rotate on every refresh: the token just used is now permanently dead.
  const newRefreshToken = signRefreshToken({ sid: session.id });
  await authRepository.rotateSession(
    session.id,
    hashToken(newRefreshToken),
    sessionExpiry(),
  );

  const accessToken = signAccessToken({
    sub: admin.id,
    role: admin.role,
    sid: session.id,
  });
  logger.info(`Session refreshed for admin: ${admin.id}`);
  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(sessionId: string) {
  await authRepository.revokeSession(sessionId);
  logger.info(`Session revoked: ${sessionId}`);
}

export async function logoutAllDevices(adminId: string) {
  await authRepository.revokeAllSessions(adminId);
  logger.info(`All sessions revoked for admin: ${adminId}`);
}
