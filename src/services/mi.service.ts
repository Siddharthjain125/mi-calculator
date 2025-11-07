import { injectable, inject } from 'tsyringe';
import { RateRepository } from '../repositories/rate.repository';
import { CalculateMiRequest, CalculateMiResponse } from '../models/types';
import { BusinessError, ValidationError } from '../errors';
import dayjs from 'dayjs';

/**
 * IMPORTANT ASSUMPTION (to match sample scenarios):
 * Rate sheet numeric values (e.g. 0.42) are combined with adjustments
 * and then converted to an annual decimal by multiplying by 0.1.
 * Example: base 0.42 => finalValue 0.42 => annual decimal 0.042 (4.2%).
 */
@injectable()
export class MiService {
  constructor(@inject(RateRepository) private rateRepo: RateRepository) {}

  calculate(request: CalculateMiRequest): CalculateMiResponse {
    const sheet = this.rateRepo.getRateSheet();
    const elig = sheet.eligibility;
    const errors: { field: string; message: string }[] = [];

    if (request.creditScore < elig.minCreditScore) {
      errors.push({ field: 'creditScore', message: `creditScore must be >= ${elig.minCreditScore}` });
    }
    if (request.loanAmount < elig.minLoanAmount || request.loanAmount > elig.maxLoanAmount) {
      errors.push({ field: 'loanAmount', message: `loanAmount must be between ${elig.minLoanAmount} and ${elig.maxLoanAmount}` });
    }
    if (request.propertyValue <= request.loanAmount) {
      errors.push({ field: 'propertyValue', message: 'propertyValue must be greater than loanAmount' });
    }
    if (errors.length) throw new ValidationError('Validation failed', errors);

    const ltv = Number(((request.loanAmount / request.propertyValue) * 100).toFixed(2));

    if (ltv <= elig.miRequiredThreshold) {
      return {
        monthlyPremium: 0,
        annualPremium: 0,
        premiumRate: 0,
        ltv,
        provider: this.selectProvider(request.creditScore, sheet.rates.providers),
        eligible: false,
        metadata: { calculatedAt: dayjs().toISOString(), rateVersion: sheet.version }
      };
    }

    const baseRates = sheet.rates.baseRates as Record<string, { low: number; medium: number; high: number }>;
    let base: number | null = null;
    if (ltv > 80 && ltv <= 85) base = this.byScore(baseRates['80.01-85'], request.creditScore);
    else if (ltv > 85 && ltv <= 90) base = this.byScore(baseRates['85.01-90'], request.creditScore);
    else if (ltv > 90 && ltv <= 95) base = this.byScore(baseRates['90.01-95'], request.creditScore);
    else if (ltv > 95 && ltv <= 97) base = this.byScore(baseRates['95.01-97'], request.creditScore);
    else throw new BusinessError('Loan does not meet MI eligibility criteria');

    let finalValue = base;

    if (request.loanPurpose === 'refinance') finalValue += sheet.rates.adjustments.loanPurpose.refinance ?? 0;
    if (request.borrowerType === 'firstTime' && request.loanPurpose === 'purchase')
      finalValue += sheet.rates.adjustments.borrowerType.firstTime ?? 0;
    const stateAdj = sheet.rates.adjustments.states[request.propertyState.toUpperCase()];
    if (stateAdj) finalValue += stateAdj;

    const annualRateDecimal = finalValue * 0.1;
    const annualPremium = Number((request.loanAmount * annualRateDecimal).toFixed(2));
    const monthlyPremium = Number((annualPremium / 12).toFixed(2));

    return {
      monthlyPremium,
      annualPremium,
      premiumRate: Number(finalValue.toFixed(3)),
      ltv,
      provider: this.selectProvider(request.creditScore, sheet.rates.providers),
      eligible: true,
      metadata: { calculatedAt: dayjs().toISOString(), rateVersion: sheet.version }
    };
  }

  private byScore(bucket: { low: number; medium: number; high: number }, score: number): number {
    if (score >= 720) return bucket.high;
    if (score >= 680) return bucket.medium;
    return bucket.low;
  }

  private selectProvider(score: number, providers: any): string {
    if (score >= 720) return providers.high;
    if (score >= 680) return providers.medium;
    return providers.low;
  }
}
