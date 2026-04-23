import './style.css';
import { API } from './db.js';
import { APP_VERSION } from './constants.js';
import { state } from './state.js';
import { t, _uuid, _isPlanDueOnDate } from './utils.js';
import { loadData } from './services/data-service.js';
import './services/ai-service.js';
import { renderDashboard } from './views/dashboard.js';
import { renderMedications } from './views/medications.js';
import { renderPlans } from './views/plans.js';
import { renderLog, renderHistory } from './views/history.js';
import { renderSettings } from './views/settings.js';
import { _renderInstallPrompt } from './views/components.js';

// Re-expose to window for inline handlers
window.state = state;
window.t = t;
window._isPlanDueOnDate = _isPlanDueOnDate;

window.navigate = (view) => {
  state.currentView = view;
  window.render();
};

window.render = async () => {
  const appDiv = document.getElementById('app');
  let content = '';

  switch (state.currentView) {
    case 'dashboard': content = renderDashboard(); break;
    case 'medications': content = renderMedications(); break;
    case 'plans': content = renderPlans(); break;
    case 'log': content = renderLog(); break;
    case 'history': content = renderHistory(); break;
    case 'settings': content = renderSettings(); break;
    default: content = renderDashboard();
  }

  appDiv.innerHTML = `
    <div class="header">
      <div>
        <div class="text-h1">MedicaTrack <span style="font-size: 14px; color: var(--accent-color); vertical-align: top;">v${APP_VERSION}</span></div>
        <div class="text-body">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn btn-secondary" style="width:auto; padding:8px 12px; font-size:12px;" onclick="window.navigate('settings')">⚙️</button>
      </div>
    </div>
    <div class="main-content">
      ${content}
      ${_renderInstallPrompt()}
    </div>
  `;
  _updateNavUI();
};

function _updateNavUI() {
  const views = ['dashboard', 'medications', 'plans', 'history'];
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone) document.body.classList.add('is-pwa');
  else document.body.classList.remove('is-pwa');

  views.forEach(v => {
    const el = document.getElementById(`nav-${v}`);
    if (el) {
      const isActive = state.currentView === v || (state.currentView === 'log' && v === 'history');
      if (isActive) {
        el.classList.add('active');
        el.style.filter = 'drop-shadow(0 0 8px var(--accent-color))';
      } else {
        el.classList.remove('active');
        el.style.filter = '';
      }
    }
  });
}

// Global Force Reload
window._forceReload = async () => {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (let r of regs) await r.unregister();
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    for (let k of keys) await caches.delete(k);
  }
  window.location.reload(true);
};

// Start App
window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
  await loadData();
  window.render();
});

// Re-expose API for console
window.API = API;
