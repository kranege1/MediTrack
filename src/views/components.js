import { t } from '../utils.js';
import { state } from '../state.js';

export function _renderAdverseBox(text, medName) {
  return `
    <div style="background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); border-radius: 12px; padding: 16px; margin-top: 10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-weight: 700; color: #fca5a5; font-size: 13px;">⚠️ ${t('sideEffectsTitle')}</div>
        <button class="btn btn-secondary" style="width:auto; padding:4px 10px; font-size:10px; border-color:#fca5a5; color:#fca5a5;" onclick="window.showAdverseOverlay(null, \`${text.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`, '${medName}')">
          ${t('detailsBtn')}
        </button>
      </div>
      <div style="font-size: 11px; line-height: 1.4; color: #fecaca; opacity:0.8; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${text}</div>
    </div>
  `;
}

export function showAdverseOverlay(id, rawText, name) {
  const med = id ? state.medications.find(m => m.id === id) : null;
  const displayName = name || (med ? med.name : 'Medikament');
  const adverseEvents = rawText || (med ? med.adverse_events : '');

  const overlay = document.createElement('div');
  overlay.id = 'adverse-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  const rows = _parseAdverseEvents(adverseEvents);
  const tableHtml = rows.length ? `
    <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:13px;">
      <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
        <th style="text-align:left; padding:8px 4px; opacity:0.5;">${t('frequency')}</th>
        <th style="text-align:left; padding:8px 4px; opacity:0.5;">${t('symptom')}</th>
      </tr>
      ${rows.map(r => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:10px 4px; color:var(--accent-color); font-weight:700;">${r.freq}</td>
          <td style="padding:10px 4px; opacity:0.9;">${r.symp}</td>
        </tr>
      `).join('')}
    </table>
  ` : `<div style="padding:20px; text-align:center; opacity:0.5;">${adverseEvents || 'Keine Daten'}</div>`;

  overlay.innerHTML = `
    <div class="glass-panel" style="max-width: 500px; width: 100%; max-height: 85vh; overflow-y: auto; border: 1px solid rgba(248, 113, 113, 0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="text-h2" style="margin:0; color:#fca5a5;">${t('sideEffectsTitle')}</div>
        <button onclick="window.closeAdverseOverlay()" style="background:none; border:none; color:#fff; font-size:24px; cursor:pointer;">&times;</button>
      </div>
      <div style="font-weight:700; font-size:18px; margin-bottom:10px;">${displayName}</div>
      
      <div id="adv-trans-container" style="display:none; background:rgba(74,222,128,0.1); padding:12px; border-radius:10px; margin-bottom:16px; font-size:12px;"></div>
      
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        <button onclick="window.translateAdverse('overlay', \`${adverseEvents.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`)" class="btn btn-secondary" style="font-size:11px; flex:1;">🌐 ${t('translateAdverse')}</button>
        <button onclick="window.open('https://www.startpage.com/sp/search?query=${encodeURIComponent(displayName + ' ' + t('sideEffectsTitle'))}', '_blank')" class="btn btn-secondary" style="font-size:11px; flex:1;">🔍 Search Online</button>
      </div>

      ${tableHtml}

      <div id="adv-overlay" style="display:none; margin-top:16px; font-size:12px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border-left:3px solid var(--accent-color);"></div>

      <button class="btn" onclick="window.closeAdverseOverlay()" style="margin-top:20px;">${t('close')}</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

export function closeAdverseOverlay() {
  const el = document.getElementById('adverse-overlay');
  if (el) el.remove();
}

export function _parseAdverseEvents(text) {
  if (!text) return [];
  const rows = [];
  const lines = text.split('\n');
  lines.forEach(l => {
    if (l.includes(':')) {
      const parts = l.split(':');
      rows.push({ freq: parts[0].trim(), symp: parts.slice(1).join(':').trim() });
    }
  });
  return rows;
}

export function _renderInstallPrompt() {
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const hasBeenDismissed = localStorage.getItem('med_install_dismissed');

  if (isiOS && !isStandalone && !hasBeenDismissed) {
    return `
      <div id="install-prompt" class="glass-panel" style="margin-top:20px; padding:16px; border:1px solid var(--accent-color); animation: slideUp 0.5s ease-out;">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div style="display:flex; gap:12px; align-items:center;">
             <div style="background:var(--accent-color); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#000;">
               <svg style="width:20px;height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
             </div>
             <div>
                <div style="font-weight:600; font-size:14px;">Als App installieren</div>
                <div style="font-size:12px; color:var(--text-secondary);">Keine Safari-Leisten & mehr Platz</div>
             </div>
          </div>
          <button onclick="window._dismissInstall()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">✕</button>
        </div>
      </div>
    `;
  }
  return '';
}

window._renderAdverseBox = _renderAdverseBox;
window.showAdverseOverlay = showAdverseOverlay;
window.closeAdverseOverlay = closeAdverseOverlay;
window._dismissInstall = () => {
  localStorage.setItem('med_install_dismissed', '1');
  const el = document.getElementById('install-prompt');
  if (el) el.style.display = 'none';
};
