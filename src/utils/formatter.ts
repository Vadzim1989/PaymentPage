// src/utils/formatter.ts
import { CURRENCY } from "@/constants/index"; // Убедитесь, что этот импорт корректен

export default class Formatter {
  static amountToMinorAmount(amount: string | number): string {
    const amountMinor = parseFloat(String(amount)) * 100;
    return (amountMinor || 0).toFixed(0);
  }

  static amountMinorToAmount(amountMinor: string | number): string {
    const amount = parseFloat(String(amountMinor)) / 100;
    return (amount || 0).toFixed(2);
  }

  static urlToStringWithoutProtocol(url?: string): string {
    return url ? url.replace(/https?:\/\//, "") : "";
  }

  static getReadableTime(
    currentPaymentExpiryTime: string | number | Date,
    dateTimeOptions?: Intl.DateTimeFormatOptions
  ): string {
    return new Date(currentPaymentExpiryTime).toLocaleTimeString("ru", dateTimeOptions);
  }

  static formatCurrency(
    amount: string | number,
    currency?: string,
    locale = "ru"
  ): string {
    // ✅ ИСПРАВЛЕНИЕ 2: Используем 'as const', чтобы TypeScript знал точный литерал типа
    const options: Intl.NumberFormatOptions = {
      style: currency ? ("currency" as const) : ("decimal" as const),
      currency: currency || CURRENCY.RUB,
    };

    if (!currency) {
      options.minimumFractionDigits = 2;
    }

    const formatter = new Intl.NumberFormat(locale, options);

    return formatter.format(Number(this.amountMinorToAmount(amount)));
  }

  static getTimeWithoutMilliseconds(timestamp: number): number {
    return Math.floor(timestamp / 1000) * 1000;
  }

  static bonus(amount: number, bonusRate: number, currency?: string): string | number {
    return amount && bonusRate
      ? this.formatCurrencyWithDot(amount * bonusRate, currency)
      : 0;
  }

  static currency(value?: string): string {
    if (!value) return "";
    
    switch (value) {
      case CURRENCY.GEL:
        return "₾";
      case CURRENCY.USD:
        return "$";
      case CURRENCY.EUR:
        return "€";
      default:
        return value;
    }
  }

  static formatCurrencyWithDot(amount: string | number, currency?: string): string {
    const options: Intl.NumberFormatOptions = {
      style: currency ? ("currency" as const) : ("decimal" as const),
      currency: currency || CURRENCY.RUB,
    };

    if (!currency) {
      options.minimumFractionDigits = 2;
    }

    const formatter = new Intl.NumberFormat("ru", options);

    const amountValue = Number(this.amountMinorToAmount(amount));
    const amountWithCurrency = formatter.format(amountValue);

    return amountWithCurrency.replace(",", ".");
  }

  static capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
  }

  static formatGCLocalCardName(value: string): string {
    return value ? value.slice(0, 3) + value.slice(3).toLowerCase() : "";
  }

  static formatGCLocalCardPan(pan: string): string {
    return pan ? "xxxx xxxx xxxx " + pan.slice(-4) : "";
  }

  static formatAmexDebitCardName(value: string): string {
    return value ? `${this.capitalize(value)}_debit` : "";
  }
}