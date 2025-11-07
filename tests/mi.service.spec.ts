import 'reflect-metadata';
import { MiService } from '../src/services/mi.service';
import { RateRepository } from '../src/repositories/rate.repository';
import { ValidationError, BusinessError } from '../src/errors';

const repo = new RateRepository();
const service = new MiService(repo);

describe('MiService', () => {
  test('Scenario 1 - Eligible (basic)', () => {
    const req: any = {
      loanAmount: 340000,
      propertyValue: 400000,
      creditScore: 740,
      propertyState: 'TX',
      loanPurpose: 'purchase',
      borrowerType: 'repeat'
    };
    const res = service.calculate(req);
    expect(res.ltv).toBeCloseTo(85.0);
    expect(res.annualPremium).toBeCloseTo(14280);
    expect(res.monthlyPremium).toBeCloseTo(1190);
    expect(res.premiumRate).toBeCloseTo(0.42, 2);
    expect(res.provider).toBe('MGIC');
    expect(res.eligible).toBe(true);
  });

  test('Scenario 2 - First-time CA', () => {
    const req: any = {
      loanAmount: 475000,
      propertyValue: 500000,
      creditScore: 700,
      propertyState: 'CA',
      loanPurpose: 'purchase',
      borrowerType: 'firstTime'
    };
    const res = service.calculate(req);
    expect(res.ltv).toBeCloseTo(95.0);
    expect(res.monthlyPremium).toBeCloseTo(3483.33, 2);
    expect(res.provider).toBe('Radian');
    expect(res.eligible).toBe(true);
  });

  test('Scenario 3 - Not eligible (LTV <= 80)', () => {
    const req: any = {
      loanAmount: 300000,
      propertyValue: 400000,
      creditScore: 720,
      propertyState: 'FL',
      loanPurpose: 'purchase',
      borrowerType: 'repeat'
    };
    const res = service.calculate(req);
    expect(res.ltv).toBeCloseTo(75.0);
    expect(res.eligible).toBe(false);
    expect(res.monthlyPremium).toBe(0);
    expect(res.annualPremium).toBe(0);
  });

  test('Scenario 4 - Validation error (propertyValue <= loanAmount)', () => {
    const req: any = {
      loanAmount: 600000,
      propertyValue: 500000,
      creditScore: 740,
      propertyState: 'NY',
      loanPurpose: 'purchase',
      borrowerType: 'repeat'
    };
    expect(() => service.calculate(req)).toThrow(ValidationError);
  });

  test('Credit score too low', () => {
    const req: any = {
      loanAmount: 100000,
      propertyValue: 120000,
      creditScore: 450,
      propertyState: 'NY',
      loanPurpose: 'purchase',
      borrowerType: 'repeat'
    };
    expect(() => service.calculate(req)).toThrow(ValidationError);
  });

  test('LTV > 97 -> BusinessError', () => {
    const req: any = {
      loanAmount: 990000,
      propertyValue: 1000000,
      creditScore: 700,
      propertyState: 'TX',
      loanPurpose: 'purchase',
      borrowerType: 'repeat'
    };
    expect(() => service.calculate(req)).toThrow(BusinessError);
  });
});
