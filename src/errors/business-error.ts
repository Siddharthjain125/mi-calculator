import { AppError } from './app-error';
export class BusinessError extends AppError {
  constructor(message: string, code = 'INELIGIBLE_LOAN') {
    super(message, code, 422);
  }
}
