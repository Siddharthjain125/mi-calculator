import { z } from 'zod';
import { CalculateMiRequest } from '../models/types';

const requestSchema = z.object({
  loanAmount: z.number().gt(0, 'loanAmount must be > 0'),
  propertyValue: z.number().gt(0, 'propertyValue must be > 0'),
  creditScore: z.number().int('creditScore must be integer').gte(0, 'creditScore must be >= 0'),
  propertyState: z.string().length(2, 'propertyState must be 2-letter code'),
  loanPurpose: z.enum(['purchase', 'refinance']),
  borrowerType: z.enum(['firstTime', 'repeat'])
});

export function validateRequest(body: unknown): { value?: CalculateMiRequest; errors?: { field: string; message: string }[] } {
  const result = requestSchema.safeParse(body);
  if (result.success) return { value: result.data };
  const errors = result.error.errors.map(e => ({
    field: e.path.join('.') || 'body',
    message: e.message
  }));
  return { errors };
}
