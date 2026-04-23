import { state } from '../state.js';
import { t } from '../utils.js';

export function renderDashboard() {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  
  let forecastHtml = '';
  for (let i = 0; i < 14; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    targetDate.setHours(0, 0, 0, 0);
    const isToday = i === 0;
    const isTomorrow = i === 1;

    let dateLabel = targetDate.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' });
    if (isToday) dateLabel = t('today');
    else if (isTomorrow) dateLabel = t('tomorrow');

    const duePlans = state.plans.filter(p => window._isPlanDueOnDate(p, targetDate));

    const dayLogs = state.logs.filter(l => {
      const d = new Date(l.timestamp);
      d.setHours(0,0,0,0);
      return d.getTime() === targetDate.getTime();
    });
    const adHocLogs = dayLogs.filter(l => !l.planId);

    if (duePlans.length > 0 || adHocLogs.length > 0) {
      const itemsHtml = duePlans.map(p => {
        const isAppt = p.type === 'appointment';
        const med = !isAppt ? (state.medications.find(m => m.id === p.medicationId) || { name: t('unknown') }) : null;

        const targetDateISO = targetDate.toISOString().split('T')[0];
        const logEntry = dayLogs.find(l => l.planId === p.id && l.plannedDate === targetDateISO);
        const isCompleted = !isAppt && logEntry && logEntry.status === 'taken';
        const isSkipped = !isAppt && logEntry && logEntry.status === 'skipped';

        if (isSkipped) return '';

        let statusColor = isCompleted ? 'var(--accent-color)' : (isToday ? '#ef4444' : 'rgba(255,255,255,0.2)');
        if (isAppt) statusColor = '#8b5cf6';

        const opacity = isCompleted ? '0.6' : '1';

        const title = isAppt ? `💊 ${p.doctorName}` : med.name;
        const subtitle = isAppt
          ? `${p.location ? '📍 ' + p.location : ''} ${p.phone ? ' | 📞 ' + p.phone : ''}`
          : `${t(p.timeCategory || 'morning')} | ${p.dose} ${med.unit || t('units')}`;

        return `
          <div class="card" style="border-left: 3px solid ${statusColor}; opacity: ${opacity}; margin-bottom: 8px; padding: 12px; display:flex; justify-content:space-between; align-items:center;">
            <div style="flex:1; min-width:0;">
              <div class="card-title" style="font-size:14px; margin-bottom:0;">${title}</div>
              <div class="card-subtitle" style="font-size:11px; word-break:break-word;">${subtitle}</div>
              ${isAppt && p.note ? `<div style="font-size:10px; color:#94a3b8; margin-top:4px; font-style:italic;">"${p.note}"</div>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${!isAppt && isToday && !isCompleted ? `
                <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:var(--accent-color); color:var(--accent-color);" onclick="window.confirmIntake('${p.id}', '${targetDateISO}')" ontouchstart="window.confirmIntake('${p.id}', '${targetDateISO}')">✓</button>
                <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:#f87171; color:#f87171;" onclick="window.skipIntake('${p.id}', '${targetDateISO}')" ontouchstart="window.skipIntake('${p.id}', '${targetDateISO}')">✕</button>
              ` : (!isAppt && isToday && isCompleted ? `<div style="color:var(--accent-color); font-size:10px; font-weight:700;">${t('completed')}</div>` : '')}
              <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:rgba(255,255,255,0.15);" onclick="window._exportSingleEvent('${p.id}', '${targetDate.toISOString()}')" title="${t('addToCalendar')}">🗓️</button>
            </div>
          </div>
          ${!isAppt && isToday && !isCompleted && p.linkedMetrics && p.linkedMetrics.length > 0 ? `
             <div id="metrics-entry-${p.id}" style="margin-bottom:12px; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
               <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                 ${p.linkedMetrics.map(type => `
                   <input type="text" id="m-val-${p.id}-${type}" placeholder="${t(type === 'weight' ? 'weight' : (type === 'bp' ? 'bloodPressure' : type))}" style="padding:6px; font-size:10px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:white;">
                 `).join('')}
               </div>
             </div>
          ` : ''}
        `;
      }).join('');

      const adHocHtml = adHocLogs.map(l => {
        const med = state.medications.find(m => m.id === l.medicationId) || { name: l.medName || t('unknown') };
        const time = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="card" style="border-left: 3px solid var(--accent-color); opacity: 0.8; margin-bottom: 8px; padding: 12px; display:flex; justify-content:space-between; align-items:center; background: rgba(74, 222, 128, 0.05);">
            <div style="flex:1; min-width:0;">
              <div class="card-title" style="font-size:14px; margin-bottom:0;">${med.name} (${t('adHoc')})</div>
              <div class="card-subtitle" style="font-size:11px;">${l.amount_taken} ${med.unit || t('units')} • ${time}</div>
            </div>
            <div style="color:var(--accent-color); font-size:10px; font-weight:700;">${t('completed')}</div>
          </div>
        `;
      }).join('');

      forecastHtml += `
        <div style="margin-bottom: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:13px; font-weight:700; color:${isToday ? 'var(--accent-color)' : '#94a3b8'}; text-transform:uppercase; letter-spacing:0.5px;">${dateLabel}</div>
            ${isToday ? `<button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:10px; border-color:var(--accent-color); color:var(--accent-color);" onclick="window.navigate('log')">+ ${t('adHoc')}</button>` : ''}
          </div>
          ${itemsHtml}
          ${adHocHtml}
        </div>
      `;
    }
  }

  const todaysLogsReverse = state.logs.filter(l => new Date(l.timestamp).setHours(0, 0, 0, 0) === todayStart).reverse();
  const logsHtml = todaysLogsReverse.length ? todaysLogsReverse.map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || { name: l.medName || t('unknown') };
    return `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; opacity:0.7;">
              <span>${med.name} (${l.amount_taken})</span>
              <span>${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>`;
  }).join('') : `<div style="font-size:11px; opacity:0.5;">${t('noLogsToday')}</div>`;

  return `
    <div class="glass-panel">
      <div class="text-h2">${t('dueToday')}</div>
      <div class="card-list">
        ${forecastHtml || `<div class="empty-state">${t('noUpcoming')}</div>`}
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:20px;">
        <div class="text-h2" style="font-size:14px; margin-bottom:12px; opacity:0.8;">${t('loggedActivity')}</div>
        ${logsHtml}
      </div>
    </div>
  `;
}
