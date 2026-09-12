import { describe, expect, it, vi } from 'vitest';
import {
  AiProviderConfigurationError,
  AiProviderError,
  AiProviderTimeoutError,
} from './ai.errors';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';
import type { FetchImplementation } from './ai.types';

const providerConfig = {
  apiKey: 'test-key',
  baseUrl: 'https://provider.example/v1/',
  model: 'test-model',
  timeoutMs: 50,
};

function createFetchMock() {
  return vi.fn() as unknown as FetchImplementation;
}

describe('OpenAiCompatibleProvider', () => {
  it('sends instructions, tools, and structured-output settings through one provider boundary', async () => {
    const fetchMock = createFetchMock();
    vi.mocked(fetchMock).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'completion-1',
          model: 'test-model',
          choices: [
            {
              finish_reason: 'tool_calls',
              message: {
                content: null,
                tool_calls: [
                  {
                    id: 'call-1',
                    function: {
                      name: 'get_balance',
                      arguments: '{"currency":"NGN"}',
                    },
                  },
                ],
              },
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
        }),
        { status: 200 },
      ),
    );
    const provider = new OpenAiCompatibleProvider(providerConfig, fetchMock);

    const result = await provider.complete({
      messages: [
        { role: 'system', content: 'System instructions' },
        { role: 'developer', content: 'Developer instructions' },
        { role: 'user', content: 'User request' },
      ],
      temperature: 0.2,
      tools: [
        {
          name: 'get_balance',
          description: 'Gets the authenticated user balance',
          parameters: { type: 'object', properties: {} },
        },
      ],
      structuredOutput: {
        name: 'intent',
        schema: { type: 'object', properties: {} },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    const options = vi.mocked(fetchMock).mock.calls[0]?.[1];
    expect(JSON.parse(options?.body as string)).toMatchObject({
      model: 'test-model',
      temperature: 0.2,
      tools: [
        {
          type: 'function',
          function: { name: 'get_balance' },
        },
      ],
      response_format: { type: 'json_schema' },
    });
    expect(result).toMatchObject({
      id: 'completion-1',
      content: null,
      toolCalls: [{ id: 'call-1', name: 'get_balance' }],
      usage: { inputTokens: 10, outputTokens: 4, totalTokens: 14 },
    });
  });

  it('does not expose a provider response body on API failure', async () => {
    const fetchMock = createFetchMock();
    vi.mocked(fetchMock).mockResolvedValue(
      new Response('sensitive provider body', { status: 401 }),
    );
    const provider = new OpenAiCompatibleProvider(providerConfig, fetchMock);

    await expect(
      provider.complete({ messages: [{ role: 'user', content: 'private text' }] }),
    ).rejects.toBeInstanceOf(AiProviderError);
  });

  it('returns a safe timeout error when the request is aborted', async () => {
    const fetchMock = createFetchMock();
    const abortError = new Error('abort');
    abortError.name = 'AbortError';
    vi.mocked(fetchMock).mockRejectedValue(abortError);
    const provider = new OpenAiCompatibleProvider(providerConfig, fetchMock);

    await expect(
      provider.complete({ messages: [{ role: 'user', content: 'private text' }] }),
    ).rejects.toBeInstanceOf(AiProviderTimeoutError);
  });

  it('requires an API key only when a provider is constructed', () => {
    expect(
      () =>
        new OpenAiCompatibleProvider({
          ...providerConfig,
          apiKey: undefined,
        }),
    ).toThrow(AiProviderConfigurationError);
  });
});
