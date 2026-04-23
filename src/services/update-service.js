import { state } from '../state.js';
import { t } from '../utils.js';
import { APP_VERSION } from '../constants.js';

export async function checkUpdateAuto() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      const newVer = data.version;
      if (newVer && _isNewer(newVer, APP_VERSION)) {
        showUpdatePopup(APP_VERSION, newVer);
      }
    }
  } catch (e) {
    console.warn("Auto-update check failed", e);
  }
}

export async function checkUpdateManual(event) {
  const btn = event?.target;
  const originalText = btn ? btn.innerText : '';
  if (btn) btn.innerText = "...";

  try {
    const res = await fetch(`/version.json?t=${Date.now()}`);
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    const newVer = data.version;

    if (newVer && _isNewer(newVer, APP_VERSION)) {
      showUpdatePopup(APP_VERSION, newVer);
    } else {
      alert(t('upToDate'));
    }
  } catch (e) {
    alert("Check failed. Performing fallback reload...");
    window._forceReload();
  } finally {
    if (btn) btn.innerText = originalText;
  }
}

function _isNewer(newVer, oldVer) {
  const n = newVer.split('.').map(Number);
  const o = oldVer.split('.').map(Number);
  for (let i = 0; i < Math.max(n.length, o.length); i++) {
    const nVal = n[i] || 0;
    const oVal = o[i] || 0;
    if (nVal > oVal) return true;
    if (nVal < oVal) return false;
  }
  return false;
}

export function showUpdatePopup(oldVer, newVer) {
  const app = document.getElementById('app');
  let overlay = document.getElementById('update-overlay');
  if (overlay) return; // Already showing

  overlay = document.createElement('div');
  overlay.id = 'update-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 9999; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  `;

  overlay.innerHTML = `
    <div class="glass-panel" style="max-width: 400px; width: 100%; text-align: center; border: 1px solid var(--accent-color);">
      <div style="font-size: 40px; margin-bottom: 20px;">🚀</div>
      <div class="text-h2" style="color: var(--accent-color);">${t('updateAvailable')}</div>
      <div style="margin: 20px 0; font-size: 14px; opacity: 0.8;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>${t('currentVersion')}:</span>
          <span style="font-family: monospace;">${oldVer}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 700;">
          <span>${t('newVersion')}:</span>
          <span style="font-family: monospace; color: var(--accent-color);">${newVer}</span>
        </div>
      </div>
      <button class="btn" onclick="window._forceReload()" style="box-shadow: 0 0 20px var(--accent-color);">${t('updateNow')}</button>
      <button class="btn btn-secondary" style="margin-top: 12px; border: none; opacity: 0.5;" onclick="document.getElementById('update-overlay').remove()">${t('cancel')}</button>
    </div>
  `;

  app.appendChild(overlay);
}

// Expose to window
window.checkUpdateManual = checkUpdateManual;
window._showUpdatePopup = showUpdatePopup;
