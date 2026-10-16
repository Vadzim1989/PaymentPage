import { I18nextProvider } from 'react-i18next';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '@/localization';
import { PAYMENT_ID } from '@/constants';
import { useCommission } from '@/hooks/useCommission';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('useCommission', () => {
  it('applies a matching BIN rule and enforces its minimum commission', () => {
    const { result } = renderHook(
      () =>
        useCommission('4111111111111111', {
          amount: 1000,
          currency: 'USD',
          options: {
            bogCardsBins: '400000-499999',
            commissionRules: [{ type: 'BOG', percent: 1, minimum: 250 }],
          },
        }, 10),
      { wrapper },
    );

    expect(result.current.commission).toBe(250);
  });

  it('uses the percentage when it exceeds the configured minimum', () => {
    const { result } = renderHook(
      () =>
        useCommission('4111111111111111', {
          amount: 100000,
          options: {
            commissionRules: [{ type: 'INTERNATIONAL', percent: 2, minimum: 100 }],
          },
        }, 1000),
      { wrapper },
    );

    expect(result.current.commission).toBe(2000);
  });

  it('uses the P2P commission rule regardless of card range', () => {
    const { result } = renderHook(
      () =>
        useCommission('4111111111111111', {
          paymentId: PAYMENT_ID.P2P,
          amount: 10000,
          options: {
            commissionRules: [{ type: 'P2P', percent: 1 }],
          },
        }, 100),
      { wrapper },
    );

    expect(result.current.commission).toBe(100);
  });
});
