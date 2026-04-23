import { state } from '../state.js';
import { t } from '../utils.js';

export function renderPlans() {
  const type = state.planType || 'medication';
  const medOptions = state.medications.map(m => `<option value="${m.id}" data-dose="${m.dose}">${m.name}</option>`).join('');

  let listHtml = state.plans.map(p => {
    const isAppt = p.type === 'appointment';
    const med = !isAppt ? (state.medications.find(m => m.id === p.medicationId) || { name: t('unknown') }) : null;
    
    return `
      <div class="card" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="card-title">${isAppt ? '👨‍⚕️ ' + p.doctorName : med.name}</div>
            <div class="card-subtitle">${isAppt ? p.location : t('takes') + ' ' + p.dose + ' ' + med.unit + ' ' + t('at') + ' ' + t(p.timeCategory || 'morning')}</div>
          </div>
          <button class="btn btn-secondary" style="width:auto; padding:8px 12px; font-size:12px; border-color:#f87171; color:#f87171;" onclick="window.removePlan('${p.id}')">${t('remove')}</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">${t('plans')}</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="window._setShowAddPlanPanel(true)">${t('newPlan')}</button>
      </div>
      <div class="card-list">
        ${listHtml || `<div class="empty-state">${t('noSchedule')}</div>`}
      </div>
    </div>
  `;
}
