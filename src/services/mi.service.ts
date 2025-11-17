import { injectable, inject } from 'tsyringe';
import { RateRepository } from '../repositories/rate.repository';
import { CalculateMiRequest, CalculateMiResponse } from '../models/mi.types';
import { BusinessError, ValidationError } from '../errors';
import dayjs from 'dayjs';
import { RateSheet } from '../models/rate-sheet.types';

/**
 * IMPORTANT ASSUMPTION (to match sample scenarios):
 * Rate sheet numeric values (e.g. 0.42) are combined with adjustments
 * and then converted to an annual decimal by multiplying by 0.1.
 * Example: base 0.42 => finalValue 0.42 => annual decimal 0.042 (4.2%).
 */
@injectable()
export class MiService {
  constructor(@inject(RateRepository) private rateRepo: RateRepository) {}

  /**
   * Mortgage Insurance calculation logic
   *
   * Steps:
   * 1. Validate inputs (credit score, loan limits, loan amount < property value).
   * 2. Compute LTV (Loan-to-Value).
   * 3. If LTV <= threshold → MI is not required → return zero premium.
   * 4. Determine the base premium rate from:
   *      - LTV bucket
   *      - Credit score bracket (low / medium / high risk)
   * 5. Apply state + loan purpose + borrower adjustments.
   * 6. Convert the final rate into an annual percent:
   *        (rateValue * 0.1) → e.g., 0.42 → 4.2%
   * 7. Compute annual and monthly premiums and return structured output.
   */

  calculate(request: CalculateMiRequest): CalculateMiResponse {
    const sheet: RateSheet = this.rateRepo.getRateSheet();
    const elig = sheet.eligibility;

    // ---- INPUT VALIDATION ----
    // Business validation beyond schema validation.
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

    // ---- LTV CALCULATION ----

    const ltv = Number(((request.loanAmount / request.propertyValue) * 100).toFixed(2));

    // If LTV is below MI requirement threshold → MI is not required.
    if (ltv <= elig.miRequiredThreshold) {
      return {
        monthlyPremium: 0,
        annualPremium: 0,
        premiumRate: 0,
        ltv,
        provider: this.selectProvider(request.creditScore, sheet.rates.providers as RateSheet['rates']['providers']),
        eligible: false,
        metadata: { calculatedAt: dayjs().toISOString(), rateVersion: sheet.version }
      };
    }
    // ---- BASE RATE DETERMINATION ----
    /**
     * Determine base rate from LTV bucket and credit score bracket.
     * Throws if LTV is outside defined buckets.
     */
    const baseRates: RateSheet['rates']['baseRates'] = sheet.rates.baseRates;
    let base: number | null = null;
    if (ltv > 80 && ltv <= 85) base = this.byScore(baseRates['80.01-85'], request.creditScore);
    else if (ltv > 85 && ltv <= 90) base = this.byScore(baseRates['85.01-90'], request.creditScore);
    else if (ltv > 90 && ltv <= 95) base = this.byScore(baseRates['90.01-95'], request.creditScore);
    else if (ltv > 95 && ltv <= 97) base = this.byScore(baseRates['95.01-97'], request.creditScore);
    else throw new BusinessError('Loan does not meet MI eligibility criteria');

    // ---- APPLY ADJUSTMENTS ----
    /**
     * Each adjustment is additive:
     *  + refinance adjustment
     *  + first-time buyer discount (only for purchase loans)
     *  + state-specific surcharge
     */
    let finalValue = base;

    if (request.loanPurpose === 'refinance') finalValue += sheet.rates.adjustments.loanPurpose.refinance ?? 0;
    if (request.borrowerType === 'firstTime' && request.loanPurpose === 'purchase')
      finalValue += sheet.rates.adjustments.borrowerType.firstTime ?? 0;
    const stateAdj = sheet.rates.adjustments.states[request.propertyState.toUpperCase()];
    if (stateAdj) finalValue += stateAdj;

    // ---- PREMIUM CALCULATION ----
    /**
     * The assignment states that the numeric values in the rate sheet represent
     * *rate units*, and we convert them to their annual percentage by multiplying by 0.1.
     *
     * Example: 0.42 → 4.2% → annual premium = loanAmount * 0.042
     */

    const annualRateDecimal = finalValue * 0.1;
    const annualPremium = Number((request.loanAmount * annualRateDecimal).toFixed(2));
    const monthlyPremium = Number((annualPremium / 12).toFixed(2));

    return {
      monthlyPremium,
      annualPremium,
      premiumRate: Number(finalValue.toFixed(3)),
      ltv,
      provider: this.selectProvider(request.creditScore, sheet.rates.providers as RateSheet['rates']['providers']),
      eligible: true,
      metadata: { calculatedAt: dayjs().toISOString(), rateVersion: sheet.version }
    };
  }

  private byScore(bucket: { low: number; medium: number; high: number }, score: number): number {
    if (score >= 720) return bucket.high;
    if (score >= 680) return bucket.medium;
    return bucket.low;
  }

  private selectProvider(score: number, providers: RateSheet['rates']['providers']): string {
    if (score >= 720) return providers.high;
    if (score >= 680) return providers.medium;
    return providers.low;
  }
}
