import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Turkish locales
import authTr from './locales/tr-TR/auth.json';
import commonTr from './locales/tr-TR/common.json';
import errorsTr from './locales/tr-TR/errors.json';
import onboardingTr from './locales/tr-TR/onboarding.json';
import workerTr from './locales/tr-TR/worker.json';
import employerTr from './locales/tr-TR/employer.json';
import ratingsTr from './locales/tr-TR/ratings.json';
import systemTr from './locales/tr-TR/system.json';

// English locales
import authEn from './locales/en-US/auth.json';
import commonEn from './locales/en-US/common.json';
import errorsEn from './locales/en-US/errors.json';
import onboardingEn from './locales/en-US/onboarding.json';
import workerEn from './locales/en-US/worker.json';
import employerEn from './locales/en-US/employer.json';
import ratingsEn from './locales/en-US/ratings.json';
import systemEn from './locales/en-US/system.json';

export type SupportedLanguage = 'tr-TR' | 'en-US';

export const SUPPORTED_LANGUAGES: Array<{
  code: SupportedLanguage;
  label: string;
  flag: string;
}> = [
  { code: 'tr-TR', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
];

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: 'tr-TR',
  fallbackLng: 'tr-TR',
  resources: {
    'tr-TR': {
      common: commonTr,
      auth: authTr,
      errors: errorsTr,
      onboarding: onboardingTr,
      worker: workerTr,
      employer: employerTr,
      ratings: ratingsTr,
      system: systemTr,
    },
    'en-US': {
      common: commonEn,
      auth: authEn,
      errors: errorsEn,
      onboarding: onboardingEn,
      worker: workerEn,
      employer: employerEn,
      ratings: ratingsEn,
      system: systemEn,
    },
  },
  defaultNS: 'common',
  ns: [
    'common',
    'auth',
    'errors',
    'onboarding',
    'worker',
    'employer',
    'ratings',
    'system',
  ],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
