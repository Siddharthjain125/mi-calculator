import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('POST /api/calculate-mi', () => {
  it('returns 200 for valid request', async () => {
    const res = await request(app).post('/api/calculate-mi').send({
      loanAmount: 340000,
      propertyValue: 400000,
      creditScore: 740,
      propertyState: 'TX',
      loanPurpose: 'purchase',
      borrowerType: 'repeat'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.monthlyPremium).toBeDefined();
  });

  it('returns 400 for invalid request', async () => {
    const res = await request(app).post('/api/calculate-mi').send({ loanAmount: -1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
