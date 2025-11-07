import rateSheet from '../data/rateSheet.json';

export class RateRepository {
  private sheet: any;
  constructor() { this.sheet = rateSheet; }
  getRateSheet() { return this.sheet; }
  getVersion() { return this.sheet.version; }
}
