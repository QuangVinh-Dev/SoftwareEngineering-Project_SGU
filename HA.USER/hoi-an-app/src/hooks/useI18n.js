import { useState, useCallback } from 'react';
import { I18N } from '../data/i18n';

export function useI18n() {
  const [currentLang, setCurrentLang] = useState('VI');

  const t = useCallback((key) => {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N.VI[key] || key;
  }, [currentLang]);

  return { currentLang, setCurrentLang, t };
}