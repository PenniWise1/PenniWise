import { config } from '../../config/env';
import { AiProviderConfigurationError } from './ai.errors';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';
import type { AiProvider } from './ai.types';

export function createAiProvider(): AiProvider {
  if (config.ai.provider !== 'openai-compatible') {
    throw new AiProviderConfigurationError(
      `Unsupported AI provider: ${config.ai.provider}`,
    );
  }

  return new OpenAiCompatibleProvider(config.ai);
}
