import { describe, expect, it } from 'vitest';
import { card, getCardBrandName } from '@/utils/creditcard';

describe('credit card helpers', () => {
  it('parses card numbers and validates them with Luhn', () => {
    const validPan = '4111 1111 1111 1111';
    const invalidPan = '4111 1111 1111 1112';

    expect(card.parse(validPan)).toBe('4111111111111111');
    expect(card.luhn(card.parse(validPan))).toBe(true);
    expect(card.luhn(card.parse(invalidPan))).toBe(false);
  });

  it('identifies supported standard and custom card brands', () => {
    expect(getCardBrandName('4111111111111111')).toBe('VISA');
    expect(getCardBrandName('6212345678901234')).toBe('UPI');
    expect(getCardBrandName('6017123412341234')).toBe('GCLOCAL');
  });
});
