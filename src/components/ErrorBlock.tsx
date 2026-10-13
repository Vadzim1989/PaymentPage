import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '@/assets/scss/components/ErrorBlock.module.scss';

interface PaymentResult {
  message?: string;
  extendedCode?: string | number;
  code?: string;
  status?: string;
}

interface ErrorBlockProps {
  result: PaymentResult;
}

export const ErrorBlock: React.FC<ErrorBlockProps> = ({ result }) => {
  const { t } = useTranslation();

  // Логика отображения кода ошибки:
  // Если есть явный message — показываем его, иначе переводим по extendedCode
  const errorCodeText = result.message
    ? result.message
    : result.extendedCode !== undefined
    ? t(`errors.api.${result.extendedCode}`)
    : t('errors.api.unknown');

  return (
    <div className={styles.errorBlock}>
      <div className={styles.errorIcon}>
        <div></div>
        <span>!</span>
      </div>

      <div className={`${styles.error} ${styles.errorText}`}>
        {t('pages.result.error')}
      </div>

      <div className={`${styles.errorCode} ${styles.errorText}`}>
        {errorCodeText}
      </div>
    </div>
  );
};