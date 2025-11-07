export type CreditTierKey = 'low' | 'medium' | 'high';

export interface BaseRateBucket {
  low: number;
  medium: number;
  high: number;
}

export interface BaseRatesMap {
  '80.01-85': BaseRateBucket;
  '85.01-90': BaseRateBucket;
  '90.01-95': BaseRateBucket;
  '95.01-97': BaseRateBucket;
}

export interface Adjustments {
  loanPurpose: { refinance: number };
  borrowerType: { firstTime: number };
  states: Record<string, number>;
}

export interface Providers {
  high: string;
  medium: string;
  low: string;
}

export interface Eligibility {
  minCreditScore: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  miRequiredThreshold: number;
}

export interface RateSheet {
  version: string;
  effectiveDate: string;
  expirationDate: string;
  rates: {
    baseRates: BaseRatesMap;
    adjustments: Adjustments;
    providers: Providers;
  };
  eligibility: Eligibility;
}
