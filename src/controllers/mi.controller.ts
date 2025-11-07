import { Request, Response } from 'express';
import 'reflect-metadata';
import { validateRequest } from '../validators/request.validator';
import { MiService } from '../services/mi.service';
import { RateRepository } from '../repositories/rate.repository';
import { container } from 'tsyringe';
import { ValidationError, AppError } from '../errors';

container.registerSingleton(RateRepository);
const miService = container.resolve(MiService);

export async function calculateMiHandler(req: Request, res: Response) {
  const { value, errors } = validateRequest(req.body);
  if (errors) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: errors }
    });
  }
  try {
    const result = miService.calculate(value!);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err instanceof AppError) {
      return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}
