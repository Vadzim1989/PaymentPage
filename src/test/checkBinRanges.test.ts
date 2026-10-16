import { describe, expect, it } from 'vitest';
import { isPanInRange } from '@/utils/checkBinRanges';

describe('isPanInRange', () => {
  const ranges = ' 400000 - 499999, 510000-559999 ';

  it('matches PAN prefixes within normalized configured ranges', () => {
    expect(isPanInRange('4111111111111111', ranges)).toBe(true);
    expect(isPanInRange('5555555555554444', ranges)).toBe(true);
  });

  it('rejects out-of-range or missing values', () => {
    expect(isPanInRange('6017123412341234', ranges)).toBe(false);
    expect(isPanInRange('', ranges)).toBe(false);
    expect(isPanInRange('4111111111111111', '')).toBe(false);
  });
});
