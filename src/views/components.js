import { t } from '../utils.js';

export function _renderAdverseBox(text, medName) {
  return `
    <div style="background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); border-radius: 12px; padding: 16px;">
      <div style="font-weight: 700; color: #fca5a5; margin-bottom: 8px; font-size: 13px;">⚠️ ${t('sideEffectsTitle')}</div>
      <div style="font-size: 12px; line-height: 1.5; color: #fecaca;">${text}</div>
    </div>
  `;
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
window._dismissInstall = () => {
  localStorage.setItem('med_install_dismissed', '1');
  const el = document.getElementById('install-prompt');
  if (el) el.style.display = 'none';
};
