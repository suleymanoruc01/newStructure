import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import authTr from './locales/tr-TR/auth.json';
import commonTr from './locales/tr-TR/common.json';
import errorsTr from './locales/tr-TR/errors.json';
import onboardingTr from './locales/tr-TR/onboarding.json';
import workerTr from './locales/tr-TR/worker.json';
import employerTr from './locales/tr-TR/employer.json';
import ratingsTr from './locales/tr-TR/ratings.json';
import systemTr from './locales/tr-TR/system.json';

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
