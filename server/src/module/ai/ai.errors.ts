import AppError from '../../utils/appError';

export class AiProviderConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class AiProviderError extends AppError {
  constructor() {
    super('AI service is temporarily unavailable', 502);
  }
}

export class AiProviderTimeoutError extends AppError {
  constructor() {
    super('AI service timed out', 504);
  }
}

export class AiStructuredOutputError extends AppError {
  constructor() {
    super('AI returned an invalid response', 502);
  }
}
