export const state = {
  currentView: 'dashboard',
  medications: [],
  logs: [],
  metrics: [],
  plans: [],
  fdaTimeout: null,
  pendingAdverseEvents: null,
  editingMedId: null,
  lang: localStorage.getItem('medilang') || 'en',
  grokKey: localStorage.getItem('grok_api_key') || '',
  grokModel: localStorage.getItem('grok_model') || 'grok-4.20-non-reasoning',
  availableModels: JSON.parse(localStorage.getItem('grok_available_models') || '[]'),
  defaultRegion: localStorage.getItem('default_region') || '',
  pendingGrokResults: [],
  historyView: 'list',
  analyticsRange: 7,
  historyMedFilters: [],
  showAddMedPanel: false,
  showAddPlanPanel: false,
  showMagicImport: false,
  useLiveSearch: localStorage.getItem('use_live_search') === 'true',
  localDrugs: [],
  localDoctors: [],
  planType: 'medication'
};

// Expose to window for legacy inline handlers (to be refactored eventually)
window.state = state;
