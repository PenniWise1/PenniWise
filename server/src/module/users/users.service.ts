import { usersRepository } from './users.repository';
import { NotFoundError } from '../../utils/appError';
import logger from '../../config/logger';
import type { UpdateStatusInput } from './users.validation';

export interface AiUserProfile {
  firstName: string | null;
  lastName: string | null;
  status: string;
  riskProfile: string | null;
}

export function listUsers() {
  return usersRepository.list();
}

export async function getUser(id: string) {
  const user = await usersRepository.findById(id);
  if (!user) {
    logger.warn(`Attempt to get non-existent user ${id}`);
    throw new NotFoundError('User not found');
  }
  logger.info(`User ${id} fetched successfully`);
  return user;
}

// This intentionally exposes a smaller shape than getUser(). AI tools must
// never receive raw User records, contact details, or credential hashes.
export async function getAiUserProfile(id: string): Promise<AiUserProfile> {
  const user = await usersRepository.findById(id);
  if (!user) {
    logger.warn('AI profile lookup did not find an application user');
    throw new NotFoundError('User not found');
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    riskProfile: user.riskProfile,
  };
}

export async function updateUserStatus(id: string, input: UpdateStatusInput) {
  const user = await usersRepository.findById(id);
  if (!user) {
    logger.warn(`Attempt to update status of non-existent user ${id}`);
    throw new NotFoundError('User not found');
  }
  const updated = await usersRepository.updateStatus(id, input.status);
  logger.info(`User status updated for ${id} to ${input.status}`);
  return updated;
}
