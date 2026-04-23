import { state } from '../state.js';
import { t } from '../utils.js';

export function renderDashboard() {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  
  const checkIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const crossIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const calIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

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
          ? `${p.location ? '📍 ' + p.location : ''}`
          : `${t(p.timeCategory || 'morning')} | ${p.dose} ${med.unit || t('units')}`;

        return `
          <div class="card" style="border-left: 3px solid ${statusColor}; opacity: ${opacity}; margin-bottom: 10px; padding: 14px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
            <div style="flex:1; min-width:0;">
              <div class="card-title" style="font-size:15px; margin-bottom:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
              <div class="card-subtitle" style="font-size:11px; opacity:0.6;">${subtitle}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${!isAppt && isToday && !isCompleted ? `
                <button class="btn btn-secondary" style="width:40px; height:40px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:10px; border-color:var(--accent-color); color:var(--accent-color); background:rgba(74,222,128,0.05);" onclick="window.confirmIntake('${p.id}', '${targetDateISO}')" ontouchstart="window.confirmIntake('${p.id}', '${targetDateISO}')">
                  ${checkIcon}
                </button>
                <button class="btn btn-secondary" style="width:40px; height:40px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:10px; border-color:#f87171; color:#f87171; background:rgba(248,113,113,0.05);" onclick="window.skipIntake('${p.id}', '${targetDateISO}')" ontouchstart="window.skipIntake('${p.id}', '${targetDateISO}')">
                  ${crossIcon}
                </button>
              ` : (!isAppt && isToday && isCompleted ? `<div style="color:var(--accent-color); font-size:10px; font-weight:700; background:rgba(74,222,128,0.1); padding:4px 8px; border-radius:6px;">${t('completed')}</div>` : '')}
              <button class="btn btn-secondary" style="width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:8px; border-color:rgba(255,255,255,0.1); opacity:0.5;" onclick="window._exportSingleEvent('${p.id}', '${targetDate.toISOString()}')">
                ${calIcon}
              </button>
            </div>
          </div>
        `;
      }).join('');

      const adHocHtml = adHocLogs.map(l => {
        const med = state.medications.find(m => m.id === l.medicationId) || { name: l.medName || t('unknown') };
        const time = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="card" style="border-left: 3px solid var(--accent-color); opacity: 0.8; margin-bottom: 10px; padding: 14px; display:flex; justify-content:space-between; align-items:center; background: rgba(74, 222, 128, 0.03);">
            <div style="flex:1; min-width:0;">
              <div class="card-title" style="font-size:15px; margin-bottom:0;">${med.name} <span style="font-size:10px; opacity:0.5;">(${t('adHoc')})</span></div>
              <div class="card-subtitle" style="font-size:11px; opacity:0.6;">${l.amount_taken} ${med.unit || t('units')} • ${time}</div>
            </div>
            <div style="color:var(--accent-color); font-size:10px; font-weight:700; background:rgba(74,222,128,0.1); padding:4px 8px; border-radius:6px;">${t('completed')}</div>
          </div>
        `;
      }).join('');

      forecastHtml += `
        <div style="margin-bottom: 28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 4px;">
            <div style="font-size:12px; font-weight:700; color:${isToday ? 'var(--accent-color)' : '#94a3b8'}; text-transform:uppercase; letter-spacing:1px;">${dateLabel}</div>
            ${isToday ? `<button class="btn btn-secondary" style="width:auto; padding:4px 10px; font-size:10px; border-color:rgba(74,222,128,0.3); color:var(--accent-color); background:rgba(74,222,128,0.05); border-radius:8px;" onclick="window.navigate('log')">+ ${t('adHoc')}</button>` : ''}
          </div>
          ${itemsHtml}
          ${adHocHtml}
        </div>
      `;
    }
  }

  const todaysLogsReverse = state.logs.filter(l => new Date(l.timestamp).setHours(0, 0, 0, 0) === todayStart).reverse();
  const logsHtml = todaysLogsReverse.length ? todaysLogsReverse.slice(0, 5).map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || { name: l.medName || t('unknown') };
    return `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; opacity:0.6; background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:8px;">
              <span>${med.name} <span style="opacity:0.5;">(${l.amount_taken})</span></span>
              <span>${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>`;
  }).join('') : `<div style="font-size:11px; opacity:0.4; text-align:center; padding:10px;">${t('noLogsToday')}</div>`;

  return `
    <div class="glass-panel">
      <div class="text-h2" style="margin-bottom:20px;">${t('dueToday')}</div>
      <div class="card-list">
        ${forecastHtml || `<div class="empty-state">${t('noUpcoming')}</div>`}
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:24px; margin-top:10px;">
        <div class="text-h2" style="font-size:14px; margin-bottom:14px; opacity:0.8; display:flex; align-items:center; gap:8px;">
           <span style="font-size:16px;">⏱️</span> ${t('recentActivity')}
        </div>
        ${logsHtml}
      </div>
    </div>
  `;
}
