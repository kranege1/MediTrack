import { state } from '../state.js';
import { t } from '../utils.js';

export function renderLog() {
  const medOptions = state.medications.map(m => `<option value="${m.id}" data-dose="${m.dose}">${m.name}</option>`).join('');
  const now = new Date().toISOString().slice(0, 16);

  return `
    <div class="glass-panel">
      <div class="text-h2">${t('logIntake')}</div>
      <div class="form-group">
        <label>${t('selectMed')}</label>
        <select id="log-med" onchange="window._handleLogMedChange(this.value)">
           <option value="" disabled selected>${t('chooseOption')}</option>
           ${medOptions}
           <option value="custom">${t('otherMed')}</option>
        </select>
      </div>
      <div id="log-custom-med-container" style="display:none;" class="form-group">
        <label>${t('nameLbl')}</label>
        <input type="text" id="log-custom-name" placeholder="z.B. Ibuprofen">
      </div>
      <div class="form-group">
        <label>${t('amountTaken')}</label>
        <input type="number" id="log-amount" placeholder="${t('quantity')}">
      </div>
      <div class="form-group">
        <label>${t('logDateTime')}</label>
        <input type="datetime-local" id="log-date" value="${now}">
      </div>
      <button class="btn" onclick="window.saveLog()">${t('recordIntake')}</button>
    </div>
  `;
}

export function renderHistory() {
  return `
    <div class="glass-panel">
      <div class="text-h2">${t('history')}</div>
      <div id="history-list"></div>
    </div>
  `;
}
