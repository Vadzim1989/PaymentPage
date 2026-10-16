import { describe, expect, it } from 'vitest';
import Formatter from '@/utils/formatter';

describe('Formatter', () => {
  it('converts amounts between major and minor units', () => {
    expect(Formatter.amountToMinorAmount('12.34')).toBe('1234');
    expect(Formatter.amountMinorToAmount(1234)).toBe('12.34');
  });

  it('formats card details and URLs for display', () => {
    expect(Formatter.formatGCLocalCardPan('6017123412345678')).toBe('xxxx xxxx xxxx 5678');
    expect(Formatter.urlToStringWithoutProtocol('https://example.com/path')).toBe('example.com/path');
    expect(Formatter.urlToStringWithoutProtocol()).toBe('');
  });

  it('maps known currency codes to display symbols', () => {
    expect(Formatter.currency('USD')).toBe('$');
    expect(Formatter.currency('GEL')).toBe('₾');
    expect(Formatter.currency('RUB')).toBe('RUB');
    expect(Formatter.currency()).toBe('');
  });
});
