import rateSheet from '../data/rateSheet.json';
import { RateSheet } from '../models/rate-sheet.types';

export class RateRepository {
  private sheet: RateSheet;
  constructor() { this.sheet = rateSheet as RateSheet;
  }
  getRateSheet(): RateSheet { return this.sheet; }
  getVersion(): string { return this.sheet.version; }
}
