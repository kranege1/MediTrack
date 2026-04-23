import { state } from '../state.js';
import { t } from '../utils.js';
import { APP_VERSION } from '../constants.js';

export function renderSettings() {
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

      <button class="btn" onclick="window.saveSettings()">${t('saveSettingsBtn')}</button>
      
      <div style="margin-top:32px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.1);">
         <button class="btn btn-secondary" style="border-color:#f87171; color:#f87171;" onclick="window._deleteAllData()">${t('deleteAllData')}</button>
         <button class="btn btn-secondary" style="margin-top:12px;" onclick="window._forceReload()">${t('forceUpdateBtn')}</button>
      </div>
      
      <div style="margin-top:24px; text-align:center; opacity:0.3; font-size:10px;">
        MedicaTrack v${APP_VERSION}
      </div>
    </div>
  `;
}

window.saveSettings = async () => {
  const key = document.getElementById('grok-api-key-input').value;
  const region = document.getElementById('grok-region-input').value;
  
  state.grokKey = key;
  localStorage.setItem('grok_api_key', key);
  state.defaultRegion = region;
  localStorage.setItem('default_region', region);
  
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
