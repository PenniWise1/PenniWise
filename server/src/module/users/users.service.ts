import { usersRepository } from './users.repository';
import { NotFoundError } from '../../utils/appError';
import logger from '../../config/logger';
import type { UpdateStatusInput } from './users.validation';

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
