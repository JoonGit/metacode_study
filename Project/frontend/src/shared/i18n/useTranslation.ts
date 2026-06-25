// [Task Verification] Phase 5: Frontend - Infrastructure & UI
import { useKioskStore } from '../stores/useKioskStore';
import ko from './ko.json';
import en from './en.json';

const translations = {
  ko,
  en
};

type Translations = typeof ko;

export function useTranslation() {
  const { language } = useKioskStore();

  const t = (key: keyof Translations) => {
    return translations[language][key] || key;
  };

  return { t, language };
}
