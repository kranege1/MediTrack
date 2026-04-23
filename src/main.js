import './style.css';
import { API } from './db.js';
import { APP_VERSION } from './constants.js';
import { state } from './state.js';
import { t, _uuid, _isPlanDueOnDate } from './utils.js';
import { loadData } from './services/data-service.js';
import { checkUpdateAuto } from './services/update-service.js';
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
  try {
    state.currentView = view;
    window.render();
  } catch (e) {
    console.error("Navigation failed", e);
    alert("Fehler beim Laden der Ansicht: " + e.message);
  }
};

window.toggleLang = (lang) => {
  state.lang = lang;
  localStorage.setItem('medilang', lang);
  window.render();
};

window.render = async () => {
  const appDiv = document.getElementById('app');
  let content = '';

  try {
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
        <div style="display:flex; gap:12px; align-items:center;">
          <div style="display:flex; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
            <button onclick="window.toggleLang('en')" style="padding:6px 10px; font-size:10px; background:${state.lang === 'en' ? 'var(--accent-color)' : 'transparent'}; color:${state.lang === 'en' ? '#000' : '#fff'}; border:none;">EN</button>
            <button onclick="window.toggleLang('de')" style="padding:6px 10px; font-size:10px; background:${state.lang === 'de' ? 'var(--accent-color)' : 'transparent'}; color:${state.lang === 'de' ? '#000' : '#fff'}; border:none;">DE</button>
          </div>
          <button class="btn btn-secondary" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:10px;" onclick="window.navigate('settings')">⚙️</button>
        </div>
      </div>
      <div class="main-content">
        ${content}
        ${_renderInstallPrompt()}
      </div>
    `;
    _updateNavUI();
  } catch (e) {
    console.error("Render failed", e);
    appDiv.innerHTML = `<div class="glass-panel" style="color:#ef4444; text-align:center; padding:40px;">
      <h2>⚠️ Render Error</h2>
      <p>${e.message}</p>
      <button class="btn" onclick="window._forceReload()">App neu laden</button>
    </div>`;
  }
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

  // Auto-check for updates after 2 seconds
  setTimeout(checkUpdateAuto, 2000);
});

// Re-expose API for console
window.API = API;
