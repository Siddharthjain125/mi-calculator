export type LoanPurpose = 'purchase' | 'refinance';
export type BorrowerType = 'firstTime' | 'repeat';

export interface CalculateMiRequest {
  loanAmount: number;
  propertyValue: number;
  creditScore: number;
  propertyState: string;
  loanPurpose: LoanPurpose;
  borrowerType: BorrowerType;
}

export interface CalculateMiResponse {
  monthlyPremium: number;
  annualPremium: number;
  premiumRate: number;
  ltv: number;
  provider: string;
  eligible: boolean;
  metadata: {
    calculatedAt: string;
    rateVersion: string;
  };
}
