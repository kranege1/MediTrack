import { useStore } from '../store/useStore';
import { i18n } from '../constants';

export function useTranslation() {
  const lang = useStore((state) => state.lang);

  const t = (key: string, params?: Record<string, string | number>) => {
    if (!key) return '';
    
    // @ts-ignore
    let val = i18n[lang]?.[key] || i18n['en']?.[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    
    return val;
  };

  return { t, lang };
}
