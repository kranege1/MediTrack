import { create } from 'zustand';

interface State {
  currentView: string;
  medications: any[];
  logs: any[];
  metrics: any[];
  plans: any[];
  lang: string;
  grokKey: string;
  grokModel: string;
  availableModels: string[];
  defaultRegion: string;
  useLiveSearch: boolean;
  localDrugs: any[];
  localDoctors: any[];
  planType: 'medication' | 'appointment';
  
  // Actions
  setNavigate: (view: string) => void;
  setLang: (lang: string) => void;
  setGrokKey: (key: string) => void;
  setGrokModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;
  setDefaultRegion: (region: string) => void;
  setUseLiveSearch: (use: boolean) => void;
  setData: (key: keyof State, value: any) => void;
}

export const useStore = create<State>((set) => ({
  currentView: 'dashboard',
  medications: [],
  logs: [],
  metrics: [],
  plans: [],
  lang: localStorage.getItem('medilang') || 'en',
  grokKey: localStorage.getItem('grok_api_key') || '',
  grokModel: localStorage.getItem('grok_model') || 'grok-4.20-non-reasoning',
  availableModels: JSON.parse(localStorage.getItem('grok_available_models') || '[]'),
  defaultRegion: localStorage.getItem('default_region') || '',
  useLiveSearch: localStorage.getItem('use_live_search') === 'true',
  localDrugs: [],
  localDoctors: [],
  planType: 'medication',

  setNavigate: (view) => set({ currentView: view }),
  setLang: (lang) => {
    localStorage.setItem('medilang', lang);
    set({ lang });
  },
  setGrokKey: (key) => {
    localStorage.setItem('grok_api_key', key);
    set({ grokKey: key });
  },
  setGrokModel: (model) => {
    localStorage.setItem('grok_model', model);
    set({ grokModel: model });
  },
  setAvailableModels: (models) => {
    localStorage.setItem('grok_available_models', JSON.stringify(models));
    set({ availableModels: models });
  },
  setDefaultRegion: (region) => {
    localStorage.setItem('default_region', region);
    set({ defaultRegion: region });
  },
  setUseLiveSearch: (use) => {
    localStorage.setItem('use_live_search', String(use));
    set({ useLiveSearch: use });
  },
  setData: (key, value) => set({ [key]: value } as any),
}));
