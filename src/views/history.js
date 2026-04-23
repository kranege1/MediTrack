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
      <button class="btn" onclick="window.saveLog()" ontouchstart="window.saveLog()">${t('recordIntake')}</button>
    </div>
  `;
}

export function renderHistory() {
  const stream = _generateFullHistoryStream();
  const deleteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
  
  let listHtml = stream.map(item => {
    const isMetric = item.type === 'metric';
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
    
    let title = '';
    let subtitle = '';
    let icon = isMetric ? '📊' : '💊';
    
    if (isMetric) {
      title = t(item.metricType === 'weight' ? 'weight' : (item.metricType === 'bp' ? 'bloodPressure' : item.metricType));
      subtitle = `${item.value}`;
    } else {
      const med = state.medications.find(m => m.id === item.medicationId) || { name: item.medName || t('unknown') };
      title = med.name;
      subtitle = `${item.amount_taken} ${med.unit || t('units')}`;
    }

    return `
      <div class="card" style="padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div style="display:flex; gap:12px; align-items:center; min-width:0;">
          <div style="font-size:18px; opacity:0.7;">${icon}</div>
          <div style="min-width:0;">
            <div style="font-size:10px; opacity:0.4; margin-bottom:2px;">${dateStr} • ${timeStr}</div>
            <div class="card-title" style="font-size:14px; margin-bottom:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
            <div class="card-subtitle" style="font-size:11px; opacity:0.6;">${subtitle}</div>
          </div>
        </div>
        <button class="btn btn-secondary" style="width:30px; height:30px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:8px; border-color:rgba(248,113,113,0.3); color:#f87171; background:rgba(248,113,113,0.05);" onclick="window._deleteHistoryLog('${item.id}', '${item.type}')" ontouchstart="window._deleteHistoryLog('${item.id}', '${item.type}')">
          ${deleteIcon}
        </button>
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
