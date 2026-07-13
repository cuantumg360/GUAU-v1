import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { esES } from '@/i18n/locales/es-ES';

/**
 * Localización de GUAU. es-ES es el idioma fuente y único disponible en la
 * fase 1; la arquitectura admite añadir locales registrándolos en `resources`.
 * expo-localization decidirá el idioma inicial cuando haya más de uno.
 */
export const defaultNS = 'translation';

// eslint-disable-next-line import/no-named-as-default-member -- `use` es API de instancia de i18next, no el named export.
void i18n.use(initReactI18next).init({
  resources: {
    'es-ES': { [defaultNS]: esES },
  },
  lng: 'es-ES',
  fallbackLng: 'es-ES',
  defaultNS,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
