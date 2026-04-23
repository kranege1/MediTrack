import { state } from '../state.js';
import { t } from '../utils.js';

export function renderPlans() {
  const medOptions = state.medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  const now = new Date().toISOString().slice(0, 10);
  
  const deleteIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

  let listHtml = state.plans.map(p => {
    const isAppt = p.type === 'appointment';
    const med = !isAppt ? (state.medications.find(m => m.id === p.medicationId) || { name: t('unknown') }) : null;
    
    return `
      <div class="card" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div style="display:flex; gap:14px; align-items:center; min-width:0;">
             <div style="font-size:24px; background:rgba(255,255,255,0.03); width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; border: 1px solid rgba(255,255,255,0.05);">
               ${isAppt ? '👨‍⚕️' : '💊'}
             </div>
             <div style="min-width:0;">
                <div class="card-title" style="font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${isAppt ? p.doctorName : med.name}</div>
                <div class="card-subtitle" style="font-size:11px; margin-top:2px;">
                  ${isAppt ? p.location : `${t(p.timeCategory || 'morning')} • ${p.dose} ${med.unit || t('units')}`}
                </div>
             </div>
          </div>
          <button class="btn btn-secondary" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:10px; border-color:rgba(248,113,113,0.3); color:#f87171; background:rgba(248,113,113,0.05);" onclick="window.removePlan('${p.id}')" ontouchstart="window.removePlan('${p.id}')" title="${t('remove')}">
            ${deleteIcon}
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; gap:12px; margin-bottom:20px;">
       <button class="btn ${state.planType === 'medication' ? '' : 'btn-secondary'}" style="flex:1;" onclick="window._setPlanType('medication')">${t('medication')}</button>
       <button class="btn ${state.planType === 'appointment' ? '' : 'btn-secondary'}" style="flex:1;" onclick="window._setPlanType('appointment')">${t('appointment')}</button>
    </div>

    <div class="glass-panel" id="add-plan-panel" style="display: ${state.showAddPlanPanel ? 'block' : 'none'};">
      <div class="text-h2">${state.planType === 'appointment' ? t('appointment') : t('createSchedule')}</div>
      
      ${state.planType === 'appointment' ? renderAppointmentForm() : renderMedicationPlanForm(medOptions, now)}
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
        <button class="btn" onclick="window.savePlan()" ontouchstart="window.savePlan()">${t('savePlan')}</button>
        <button class="btn btn-secondary" onclick="window._setShowAddPlanPanel(false)" ontouchstart="window._setShowAddPlanPanel(false)">${t('cancel')}</button>
      </div>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="text-h2" style="margin: 0;">${t('plans')}</div>
        <button class="btn" style="width: auto; padding: 10px 18px; font-size: 14px; background:var(--accent-color); color:#000; border:none; box-shadow: 0 4px 15px rgba(74,222,128,0.3);" onclick="window._setShowAddPlanPanel(true)" ontouchstart="window._setShowAddPlanPanel(true)">
          + ${t('newPlan')}
        </button>
      </div>
      <div class="card-list">
        ${listHtml || `<div class="empty-state">${t('noSchedule')}</div>`}
      </div>
    </div>
  `;
}

function renderMedicationPlanForm(medOptions, now) {
  return `
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
  `;
}

function renderAppointmentForm() {
  return `
    <div class="form-group" style="position:relative;">
      <label>${t('doctorName')}</label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="appt-doctor" placeholder="Dr. Smith" style="flex:1;" oninput="window.searchDoctorLocal(this.value)">
        <button class="btn btn-secondary" style="width:auto; padding:0 10px;" onclick="window._runAISearchOnly()">✨ AI</button>
      </div>
      <div id="doctor-local-results" class="glass-panel" style="display:none; position:absolute; top:70px; left:0; right:0; z-index:100; padding:0;"></div>
      <div id="doctor-ai-results" style="display:none; margin-top:10px;"></div>
    </div>

    <div class="form-group">
      <label>${t('specialty')}</label>
      <select id="appt-specialty">
        <option value="">${t('anySpecialty')}</option>
        ${t('specialties').map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label>${t('location')}</label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="appt-region" placeholder="City" style="flex:1;" value="${state.defaultRegion}">
        <button class="btn btn-secondary" style="width:40px; padding:0;" onclick="window._geolocate('appt-region')">📍</button>
      </div>
    </div>
    
    <div class="form-group">
      <label>${t('logDateTime')}</label>
      <input type="datetime-local" id="appt-date" value="${new Date().toISOString().slice(0, 16)}">
    </div>
  `;
}

window._setShowAddPlanPanel = (val) => {
  state.showAddPlanPanel = val;
  window.render();
};

window._setPlanType = (type) => {
  state.planType = type;
  window.render();
};
