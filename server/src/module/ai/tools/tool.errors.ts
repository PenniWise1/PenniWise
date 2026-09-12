import AppError from '../../../utils/appError';

export class AiToolUnavailableError extends AppError {
  constructor() {
    super('Requested capability is not available', 422);
  }
}

export class AiToolExecutionError extends AppError {
  constructor() {
    super('Unable to complete the requested operation', 502);
  }
}
