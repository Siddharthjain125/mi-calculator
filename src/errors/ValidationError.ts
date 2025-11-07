import { AppError } from './AppError';
export class ValidationError extends AppError {
  public readonly details: { field: string; message: string }[];
  constructor(message: string, details: { field: string; message: string }[]) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}
