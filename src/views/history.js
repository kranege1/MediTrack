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
  const stream = _generateFullHistoryStream();
  
  let listHtml = stream.map(item => {
    const isMetric = item.type === 'metric';
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
    
    let title = '';
    let subtitle = '';
    
    if (isMetric) {
      title = t(item.metricType === 'weight' ? 'weight' : (item.metricType === 'bp' ? 'bloodPressure' : item.metricType));
      subtitle = `${item.value}`;
    } else {
      const med = state.medications.find(m => m.id === item.medicationId) || { name: item.medName || t('unknown') };
      title = med.name;
      subtitle = `${item.amount_taken} ${med.unit || t('units')}`;
    }

    return `
      <div class="card" style="padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:11px; opacity:0.5; margin-bottom:2px;">${dateStr} • ${timeStr}</div>
          <div class="card-title" style="font-size:14px; margin-bottom:0;">${title}</div>
          <div class="card-subtitle" style="font-size:11px;">${subtitle}</div>
        </div>
        <button class="btn btn-secondary" style="width:auto; padding:6px 10px; font-size:10px; border-color:#f87171; color:#f87171;" onclick="window._deleteHistoryLog('${item.id}', '${item.type}')">✕</button>
      </div>
    `;
  }).join('');

  return `
    <div class="glass-panel">
      <div class="text-h2">${t('history')}</div>
      <div class="card-list">
        ${listHtml || `<div class="empty-state">${t('noLogsToday')}</div>`}
      </div>
    </div>
  `;
}

function _generateFullHistoryStream() {
  const all = [
    ...state.logs.map(l => ({ ...l, type: 'log' })),
    ...state.metrics.map(m => ({ ...m, type: 'metric', metricType: m.type }))
  ];
  return all.sort((a, b) => b.timestamp - a.timestamp);
}
