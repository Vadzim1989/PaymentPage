import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CARD_BRAND } from '@/constants';
import { renderWithProviders } from '@/test/utils';
import Cvc from '@/components/ui/Cvc';
import Expiry from '@/components/ui/Expiry';
import Pan from '@/components/ui/Pan';

interface TestFormProps {
  children: ReactNode;
  defaultValues: Record<string, string>;
}

function TestForm({ children, defaultValues }: TestFormProps) {
  const methods = useForm({ defaultValues, mode: 'onSubmit' });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        {children}
        <button type="submit">Validate</button>
      </form>
    </FormProvider>
  );
}

describe('payment form validation', () => {
  it('accepts a valid card number and rejects a PAN with an invalid checksum', async () => {
    const { rerender, container } = renderWithProviders(
      <TestForm key="valid-pan" defaultValues={{ pan: '4111111111111111' }}>
        <Pan name="pan" mask="0000 0000 0000 0000" minPanLength={16} />
      </TestForm>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    await waitFor(() => expect(container.querySelector('.input__error')).toBeNull());

    rerender(
      <TestForm key="invalid-pan" defaultValues={{ pan: '4111111111111112' }}>
        <Pan name="pan" mask="0000 0000 0000 0000" minPanLength={16} />
      </TestForm>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    expect(await screen.findByText(/номер карты|карт/i)).toBeTruthy();
  });

  it('rejects an invalid expiry month and accepts expired cards only when allowed', async () => {
    const { rerender, container } = renderWithProviders(
      <TestForm key="invalid-month" defaultValues={{ expiryMonth: '13' }}>
        <Expiry type="expiryMonth" />
      </TestForm>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    expect(await screen.findByText(/месяц/i)).toBeTruthy();

    const expiredYear = String((new Date().getFullYear() - 1) % 100).padStart(2, '0');
    rerender(
      <TestForm key="expired-year" defaultValues={{ expiryYear: expiredYear }}>
        <Expiry type="expiryYear" />
      </TestForm>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    expect(await screen.findByText(/истек|срок/i)).toBeTruthy();

    rerender(
      <TestForm key="allowed-expired-year" defaultValues={{ expiryYear: expiredYear }}>
        <Expiry type="expiryYear" isExpiredCardsAllowed />
      </TestForm>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    await waitFor(() => expect(container.querySelector('.input__error')).toBeNull());
  });

  it('allows an empty UPI CVC but still validates a required card CVC', async () => {
    const { unmount, container } = renderWithProviders(
      <TestForm key="optional-cvc" defaultValues={{ cvc: '' }}>
        <Cvc minCvcLength={3} brand={CARD_BRAND.UPI} />
      </TestForm>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    await waitFor(() => expect(container.querySelector('.input__error')).toBeNull());

    unmount();
    renderWithProviders(
      <TestForm defaultValues={{ cvc: '' }}>
        <Cvc minCvcLength={3} brand={CARD_BRAND.VISA} />
      </TestForm>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    await waitFor(() => expect(document.querySelector('.input__error')).toBeTruthy());
  });
});
