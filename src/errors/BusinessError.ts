import { AppError } from './AppError';
export class BusinessError extends AppError {
  constructor(message: string, code = 'INELIGIBLE_LOAN') {
    super(message, code, 422);
  }
}
