import { state } from '../state.js';
import { t } from '../utils.js';
import { APP_VERSION } from '../constants.js';
import { API } from '../db.js';

export function renderSettings() {
  const modelSelectHtml = state.availableModels.length > 0 
    ? `<select id="grok-model-input" style="flex:1;">
        ${state.availableModels.map(m => `<option value="${m}" ${state.grokModel === m ? 'selected' : ''}>${m}</option>`).join('')}
        <option value="custom">${t('customModel')}</option>
       </select>`
    : `<input type="text" id="grok-model-input" value="${state.grokModel}" placeholder="grok-beta" style="flex:1;">`;

  return `
    <div class="glass-panel">
      <div class="text-h2">${t('settings')}</div>
      
      <div class="form-group">
        <label>${t('enteringApiKey')}</label>
        <input type="password" id="grok-api-key-input" value="${state.grokKey}" placeholder="xai-...">
      </div>
      
      <div class="form-group">
        <label>${t('defaultRegionLabel')}</label>
        <input type="text" id="grok-region-input" value="${state.defaultRegion}" placeholder="${t('regionPlaceholder')}">
      </div>

      <div class="form-group">
        <label>${t('modelIdLabel')}</label>
        <div style="display:flex; gap:8px;">
          ${modelSelectHtml}
          <button class="btn btn-secondary" style="width:auto; padding:0 12px; font-size:12px;" onclick="window.fetchGrokModels()" title="${t('refreshModels')}">🔄</button>
        </div>
        <div style="font-size:10px; opacity:0.5; margin-top:4px;">${t('modelSuggestion')}</div>
      </div>

      <div class="form-group">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="grok-livesearch-input" ${state.useLiveSearch ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--accent-color);">
          <span>${t('liveSearchLabel')}</span>
        </label>
        <div style="font-size:10px; opacity:0.5; margin-top:4px;">${t('liveSearchSub')}</div>
      </div>

      <button class="btn" onclick="window.saveSettings()">${t('saveSettingsBtn')}</button>
    </div>

    <div class="glass-panel">
      <div class="text-h2">${t('dataManagement')}</div>
      <p class="text-body" style="margin-bottom: 20px;">${t('dataNote')}</p>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn btn-secondary" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="window.exportData()">${t('exportData')}</button>
        <button class="btn btn-secondary" onclick="window.confirmClearLogs()" style="border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.05);">${t('deleteLogs')}</button>
        <button class="btn btn-danger" onclick="window._deleteAllData()" style="margin-top: 8px;">${t('deleteAllData')}</button>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;"></div>
      
      <div class="text-h2">${t('restoreData')}</div>
      <input type="file" id="import-file" accept=".json" style="margin-bottom: 12px; font-size:12px;">
      <button class="btn btn-secondary" onclick="window.importData()">${t('importRestore')}</button>
      
      <div style="margin-top:32px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); text-align:center;">
        <button class="btn btn-secondary" style="background:rgba(74,222,128,0.1); border-color:var(--accent-color); color:var(--accent-color);" onclick="window._forceReload()">
          ${t('forceUpdateBtn')}
        </button>
        <p style="font-size:10px; opacity:0.5; margin-top:8px;">
          MedicaTrack v${APP_VERSION} • Use if UI seems outdated.
        </p>
      </div>
    </div>
  `;
}

window.saveSettings = async () => {
  const key = document.getElementById('grok-api-key-input').value;
  const region = document.getElementById('grok-region-input').value;
  const model = document.getElementById('grok-model-input').value;
  const live = document.getElementById('grok-livesearch-input').checked;
  
  state.grokKey = key;
  localStorage.setItem('grok_api_key', key);
  state.defaultRegion = region;
  localStorage.setItem('default_region', region);
  state.grokModel = model;
  localStorage.setItem('grok_model', model);
  state.useLiveSearch = live;
  localStorage.setItem('use_live_search', live);
  
  alert(t('settingsSavedLabel'));
  render();
};

window._deleteAllData = async () => {
  if (confirm(t('confirmDeleteAll'))) {
    await API.clearAllData();
    localStorage.clear();
    window.location.reload();
  }
};

window.confirmClearLogs = async () => {
  if (confirm(t('confirmDeleteLogs'))) {
    await API.clearLogs();
    await window.loadData();
    window.navigate('dashboard');
  }
};

window.exportData = async () => {
  const data = {
    medications: await API.getMedications(),
    logs: await API.getLogs(),
    metrics: await API.getMetrics(),
    plans: await API.getPlans(),
    settings: {
      grokKey: state.grokKey,
      defaultRegion: state.defaultRegion,
      grokModel: state.grokModel,
      useLiveSearch: state.useLiveSearch
    },
    version: APP_VERSION,
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MedicaTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

window.importData = async () => {
  const fileInput = document.getElementById('import-file');
  if (!fileInput.files.length) return alert(t('selectFile'));
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.medications) {
        for (const m of data.medications) await API.addMedication(m);
      }
      if (data.logs) {
        for (const l of data.logs) await API.addLog(l);
      }
      if (data.metrics) {
        for (const m of data.metrics) await API.addMetric(m);
      }
      if (data.plans) {
        for (const p of data.plans) await API.addPlan(p);
      }
      if (data.settings) {
        if (data.settings.grokKey) {
          state.grokKey = data.settings.grokKey;
          localStorage.setItem('grok_api_key', state.grokKey);
        }
      }
      alert(t('restoredSuccess'));
      await window.loadData();
      window.navigate('dashboard');
    } catch (err) {
      alert(t('importError'));
    }
  };
  reader.readAsText(fileInput.files[0]);
};

window.fetchGrokModels = async () => {
  if (!state.grokKey) return alert(t('missingKeyError'));
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { "Authorization": `Bearer ${state.grokKey}` }
    });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    state.availableModels = data.models.map(m => m.id);
    localStorage.setItem('grok_available_models', JSON.stringify(state.availableModels));
    render();
  } catch (err) {
    alert(t('lookupFailed'));
  }
};
