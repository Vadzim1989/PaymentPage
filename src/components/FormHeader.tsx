import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next'
import Formatter from '@/utils/formatter';
import styles from '@/assets/scss/components/FormHeader.module.scss';

interface FormHeaderProps {
  data: any;
  hiddenPayInfo?: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  data,
  hiddenPayInfo = false,
}) => {
  const { t } = useTranslation();

  const { amount = 0, commission = 0, options = {} } = data;
  const totalAmount = amount + commission;

  const isVisibleDesc = useMemo(() => {
    return data.options?.hideDescription;
  }, [data.options?.hideDescription]);

  const isGEL = useMemo(() => {
    return data.currency === 'GEL';
  }, [data.currency]);

  // Вычисляем бонусы (аналог функций bonus(), mr_bonus(), scool_bonus())
  const bonus = useMemo(() => {
    const { plusBonusConversionRate = 0, bonusConversionRate = 0 } = options;
    return Formatter.bonus(amount, plusBonusConversionRate || bonusConversionRate);
  }, [amount, options]);

  const mrBonus = useMemo(() => {
    const { mrBonusConversionRate = 0 } = options;
    return Formatter.bonus(amount, mrBonusConversionRate);
  }, [amount, options]);

  const scoolBonus = useMemo(() => {
    const { sCoolBonusConversionRate = 0 } = options;
    return Formatter.bonus(amount, sCoolBonusConversionRate);
  }, [amount, options]);

  const payInfoClasses = [
    styles.payInfo,
    data.state === 'result' ? styles.withMargin : '',
  ].join(' ').trim();

  return (
    <section className={styles.formHeader}>
      <div className={styles.block}>
        <div className={styles.merchantLogo}>
          {data.merchant?.logoUrl && (
            <img src={data.merchant.logoUrl} alt="merchant" />
          )}
        </div>

        <div className={styles.merchantInfo}>
          {data.merchant?.name && (
            <div className={styles.name}>{data.merchant.name}</div>
          )}
          
          {data.merchant?.legalBusinessName && (
            <div className={styles.legalName}>
              {data.merchant.legalBusinessName}
            </div>
          )}

          {!isVisibleDesc && data.description && (
            <div className={styles.description}>
              {data.description}
            </div>
          )}

          {data.merchant?.country && (
            <div className={styles.description}>
              {data.merchant.country}
              {data.merchant.city && `, ${data.merchant.city}`}
            </div>
          )}
        </div>
      </div>

      {!hiddenPayInfo && (
        <div className={payInfoClasses}>
          <div className={styles.payInfoContainer}>
            <div className={styles.payInfoTitle}>
              {t('components.form-header.title.amount')}
            </div>
            <div className={styles.payInfoAmount}>
              {Formatter.formatCurrencyWithDot(totalAmount)}{' '}
              {Formatter.currency(data.currency)}
            </div>
          </div>

          {isGEL && (
            <>
              {bonus as number > 0 && (
                <div className={styles.payInfoBonus}>
                  <div className={styles.payInfoTitle}>
                    {t('components.form-header.title.bonus')}
                  </div>
                  <div className={styles.payInfoBonusAmount}>
                    {bonus}
                  </div>
                </div>
              )}

              {mrBonus as number > 0 && (
                <div className={styles.payInfoBonus}>
                  <div className={styles.payInfoTitle}>
                    {t('components.form-header.title.mr-bonus')}
                  </div>
                  <div className={styles.payInfoBonusAmount}>
                    {mrBonus}
                  </div>
                </div>
              )}

              {scoolBonus as number > 0 && (
                <div className={styles.payInfoBonus}>
                  <div className={styles.payInfoTitle}>
                    {t('components.form-header.title.scool-bonus')}
                  </div>
                  <div className={styles.payInfoBonusAmount}>
                    {scoolBonus}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};