import AppError from '../../../utils/appError';

export class AiConfirmationExpiredError extends AppError {
  constructor() {
    super('This confirmation has expired', 422);
  }
}

export class AiConfirmationUnavailableError extends AppError {
  constructor() {
    super('This confirmation is no longer available', 422);
  }
}

export class AiFinancialActionNotCompletedError extends AppError {
  constructor() {
    super('Financial action has not been confirmed as completed', 409);
  }
}
