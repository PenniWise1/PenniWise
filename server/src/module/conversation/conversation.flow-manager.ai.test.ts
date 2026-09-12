import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findOrCreate: vi.fn(), recordInboundMessageIfNew: vi.fn(), logMessage: vi.fn(),
  touchLastInteraction: vi.fn(), updateConversationState: vi.fn(), updateProfile: vi.fn(),
  sendTextMessage: vi.fn(), handle: vi.fn(),
}));

vi.mock('../users/users.repository', () => ({ usersRepository: {
  findOrCreate: mocks.findOrCreate, touchLastInteraction: mocks.touchLastInteraction,
  updateConversationState: mocks.updateConversationState, updateProfile: mocks.updateProfile,
} }));
vi.mock('./conversation.repository', () => ({ conversationRepository: {
  recordInboundMessageIfNew: mocks.recordInboundMessageIfNew, logMessage: mocks.logMessage,
} }));
vi.mock('../whatsapp/whatsapp.service', () => ({ sendTextMessage: mocks.sendTextMessage }));

import {
  handleInboundMessage,
  setAiConversationCoordinatorForTests,
} from './conversation.flow-manager';

describe('conversation flow manager AI integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOrCreate.mockResolvedValue({
      id: 'user-1', status: 'ACTIVE', firstName: 'Ada', conversationState: 'IDLE',
      conversationContext: null, lastInteractionAt: new Date(),
    });
    mocks.recordInboundMessageIfNew.mockResolvedValue(true);
    mocks.touchLastInteraction.mockResolvedValue({});
    mocks.updateConversationState.mockResolvedValue({});
    mocks.logMessage.mockResolvedValue({});
    mocks.sendTextMessage.mockResolvedValue({});
    mocks.handle.mockResolvedValue({ reply: 'Hello Ada!', nextState: 'IDLE', contextPatch: {} });
    setAiConversationCoordinatorForTests({ handle: mocks.handle });
  });

  it('persists inbound/outbound messages while routing an eligible conversation through AI', async () => {
    await handleInboundMessage({ from: '2348000000000', id: 'wamid.ai.1', timestamp: '1', type: 'text', text: { body: 'Hello' } });

    expect(mocks.recordInboundMessageIfNew).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    expect(mocks.handle).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }), 'Hello');
    expect(mocks.updateConversationState).toHaveBeenCalledWith('user-1', 'IDLE', {});
    expect(mocks.sendTextMessage).toHaveBeenCalledWith('2348000000000', 'Hello Ada!');
    expect(mocks.logMessage).toHaveBeenCalledWith(expect.objectContaining({ direction: 'OUTBOUND' }));
  });

  it('acknowledges a provider failure safely without sending fake information', async () => {
    mocks.handle.mockRejectedValue(new Error('provider failure'));
    await handleInboundMessage({ from: '2348000000000', id: 'wamid.ai.2', timestamp: '2', type: 'text', text: { body: 'My balance?' } });

    expect(mocks.sendTextMessage).toHaveBeenCalledWith(
      '2348000000000',
      expect.stringContaining('something went wrong'),
    );
  });
});
