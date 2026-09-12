import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, ValidationError } from '../../../utils/appError';
import { AiToolExecutionError, AiToolUnavailableError } from './tool.errors';

const mocks = vi.hoisted(() => ({ getAiUserProfile: vi.fn() }));

vi.mock('../../users/users.service', () => ({
  getAiUserProfile: mocks.getAiUserProfile,
}));

import { AiToolExecutor } from './tool.executor';
import { aiToolRegistry, RESERVED_HIGH_RISK_WRITE_TOOLS } from './tool.registry';

const executor = new AiToolExecutor();
const applicationContext = {
  userId: 'authenticated-user-1',
  capabilities: ['profile:read'],
};

describe('AiToolExecutor', () => {
  beforeEach(() => {
    mocks.getAiUserProfile.mockReset();
    mocks.getAiUserProfile.mockResolvedValue({
      firstName: 'Ada',
      lastName: 'Okafor',
      status: 'ACTIVE',
      riskProfile: 'MODERATE',
    });
  });

  it('executes the registered read-only profile tool using application identity', async () => {
    const result = await executor.execute(applicationContext, {
      name: 'get_user_profile',
      arguments: {},
    });

    expect(mocks.getAiUserProfile).toHaveBeenCalledWith('authenticated-user-1');
    expect(result).toEqual({
      toolName: 'get_user_profile',
      data: {
        profile: {
          firstName: 'Ada',
          lastName: 'Okafor',
          status: 'ACTIVE',
          riskProfile: 'MODERATE',
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain('transactionPinHash');
  });

  it('rejects unknown and reserved high-risk tool names', async () => {
    await expect(
      executor.execute(applicationContext, { name: 'arbitrary_code', arguments: {} }),
    ).rejects.toBeInstanceOf(AiToolUnavailableError);
    await expect(
      executor.execute(applicationContext, {
        name: RESERVED_HIGH_RISK_WRITE_TOOLS[0] ?? 'transfer_money',
        arguments: {},
      }),
    ).rejects.toBeInstanceOf(AiToolUnavailableError);
  });

  it('rejects malformed or malicious arguments, including model-selected identity', async () => {
    await expect(
      executor.execute(applicationContext, {
        name: 'get_user_profile',
        arguments: { userId: 'another-user', sql: 'SELECT * FROM users' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mocks.getAiUserProfile).not.toHaveBeenCalled();
  });

  it('requires the application-granted capability', async () => {
    await expect(
      executor.execute(
        { userId: 'authenticated-user-1', capabilities: [] },
        { name: 'get_user_profile', arguments: {} },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns a safe error when the underlying application service fails', async () => {
    mocks.getAiUserProfile.mockRejectedValue(new Error('database details'));

    await expect(
      executor.execute(applicationContext, {
        name: 'get_user_profile',
        arguments: {},
      }),
    ).rejects.toBeInstanceOf(AiToolExecutionError);
  });

  it('exposes only explicitly registered tools', () => {
    expect(aiToolRegistry.list().map((tool) => tool.name)).toEqual([
      'get_user_profile',
    ]);
    expect(aiToolRegistry.get('get_wallet_balance')).toBeUndefined();
  });
});
