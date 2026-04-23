import { state } from '../state.js';
import { t } from '../utils.js';

export function renderPlans() {
  const medOptions = state.medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  const now = new Date().toISOString().slice(0, 10);

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
          <button class="btn btn-secondary" style="width:auto; padding:8px 12px; font-size:12px; border-color:#f87171; color:#f87171;" onclick="window.removePlan('${p.id}')" ontouchstart="window.removePlan('${p.id}')">${t('remove')}</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="glass-panel" id="add-plan-panel" style="display: ${state.showAddPlanPanel ? 'block' : 'none'};">
      <div class="text-h2">${t('createSchedule')}</div>
      <div class="form-group">
        <label>${t('selectMed')}</label>
        <select id="plan-med">
           ${medOptions}
        </select>
      </div>
      <div class="form-group">
        <label>${t('timeOfDay')}</label>
        <select id="plan-time">
           <option value="morning">${t('morning')}</option>
           <option value="noon">${t('noon')}</option>
           <option value="evening">${t('evening')}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${t('dose')}</label>
        <input type="text" id="plan-dose" placeholder="E.g., 1">
      </div>
      <div class="form-group">
        <label>${t('anchorDate')}</label>
        <input type="date" id="plan-start" value="${now}">
      </div>
      <button class="btn" onclick="window.savePlan()" ontouchstart="window.savePlan()">${t('savePlan')}</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="window._setShowAddPlanPanel(false)" ontouchstart="window._setShowAddPlanPanel(false)">${t('cancel')}</button>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">${t('plans')}</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="window._setShowAddPlanPanel(true)" ontouchstart="window._setShowAddPlanPanel(true)">${t('newPlan')}</button>
      </div>
      <div class="card-list">
        ${listHtml || `<div class="empty-state">${t('noSchedule')}</div>`}
      </div>
    </div>
  `;
}

window._setShowAddPlanPanel = (val) => {
  state.showAddPlanPanel = val;
  window.render();
};
