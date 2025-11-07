# Mortgage Insurance (MI) Calculator Service

## Overview
Express + TypeScript microservice that calculates mortgage insurance premiums per the take-home assignment.

## Highlights
- TypeScript (strict)
- Dependency injection with `tsyringe`
- Input validation with `zod`
- Clear separation: controller → service → repository
- Custom error classes
- Rate-sheet stored as JSON (`src/data/rateSheet.json`)
- Unit tests with Jest

## Assumptions & Important Note
**Rate conversion assumption (important to reproduce sample outputs):**
The numeric values in the provided rate sheet (e.g. `0.42`) are interpreted as the rate units used for calculation and converted to an annual decimal by multiplying by `0.1`. Example: `0.42` → `0.042` (4.2% annual).

**LTV buckets**
- 80.01 ≤ LTV ≤ 85
- 85.01 ≤ LTV ≤ 90
- 90.01 ≤ LTV ≤ 95
- 95.01 ≤ LTV ≤ 97
- LTV ≤ 80 → MI not required (eligible=false, premium=0).
- LTV > 97 → `INELIGIBLE_LOAN` (business rule).

## Getting started
```bash
npm install
npm start            # dev (ts-node)
npm run build && npm run start:prod
npm test
```
Service listens on `http://localhost:3000`

## API
### POST /api/calculate-mi
Body:
```json
{
  "loanAmount": 350000,
  "propertyValue": 400000,
  "creditScore": 700,
  "propertyState": "CA",
  "loanPurpose": "purchase",
  "borrowerType": "firstTime"
}
```
Success `200`:
```json
{
  "success": true,
  "data": {
    "monthlyPremium": 1190,
    "annualPremium": 14280,
    "premiumRate": 0.42,
    "ltv": 85,
    "provider": "MGIC",
    "eligible": true,
    "metadata": { "calculatedAt": "...", "rateVersion": "2024-Q4" }
  }
}
```

Errors:
- 400 `VALIDATION_ERROR` (with details)
- 422 `INELIGIBLE_LOAN`

## Tests
`npm test` runs Jest and collects coverage from `src/**/*.ts`

## Design notes
- `tsyringe` for DI: easy to wire services and repos.
- `zod` for concise and typed validation.
- Repository returns JSON rate-sheet; swap to DB/cache later.
- No extrapolation beyond provided LTV ranges.

## Time spent
About 4–6 hours including tests and docs.
