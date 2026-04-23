import { state } from '../state.js';
import { t } from '../utils.js';

export function renderMedications() {
  const formatIcons = { 'Pill': '💊', 'Liquid': '💧', 'Injection': '💉', 'Inhaler': '🌬️' };
  
  const showPanel = state.showAddMedPanel || state.editingMedId;
  const editingMed = state.editingMedId ? state.medications.find(m => m.id === state.editingMedId) : null;

  let listHtml = state.medications.map(m => `
    <div class="card" style="padding:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; gap:12px; align-items:center;">
          <div style="font-size:24px; background:rgba(255,255,255,0.05); width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
            ${formatIcons[m.format] || '💊'}
          </div>
          <div>
            <div class="card-title">${m.name}</div>
            <div class="card-subtitle">${m.dose} ${m.unit} • ${t(m.format.toLowerCase() + 'Format') || m.format}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary" style="width:auto; padding:8px 12px; font-size:12px;" onclick="window.editMed('${m.id}')" ontouchstart="window.editMed('${m.id}')">${t('editBtn')}</button>
          <button class="btn btn-secondary" style="width:auto; padding:8px 12px; font-size:12px; border-color:#f87171; color:#f87171;" onclick="window.deleteMed('${m.id}')" ontouchstart="window.deleteMed('${m.id}')">${t('delete')}</button>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="glass-panel" id="add-med-panel" style="display: ${showPanel ? 'block' : 'none'};">
      <div class="text-h2" id="add-med-title">${state.editingMedId ? t('updateMedication') : t('addMedication')}</div>
      <input type="hidden" id="med-id" value="${state.editingMedId || ''}">
      <div class="form-group">
        <label>${t('nameLbl')}</label>
        <input type="text" id="med-name" value="${editingMed ? editingMed.name : ''}" placeholder="E.g., Aspirin">
      </div>
      <div class="form-group">
        <label>${t('defaultDose')}</label>
        <input type="text" id="med-dose" value="${editingMed ? editingMed.dose : ''}" placeholder="E.g., 500">
      </div>
      <div class="form-group">
        <label>${t('unitLbl')}</label>
        <select id="med-unit">
          <option value="mg" ${editingMed?.unit === 'mg' ? 'selected' : ''}>mg</option>
          <option value="ml" ${editingMed?.unit === 'ml' ? 'selected' : ''}>ml</option>
          <option value="${t('pillUnit')}" ${editingMed?.unit === t('pillUnit') ? 'selected' : ''}>${t('pillUnit')}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${t('formatLbl')}</label>
        <select id="med-format">
          <option value="Pill" ${editingMed?.format === 'Pill' ? 'selected' : ''}>${t('pillFormat')}</option>
          <option value="Liquid" ${editingMed?.format === 'Liquid' ? 'selected' : ''}>${t('liquidFormat')}</option>
          <option value="Injection" ${editingMed?.format === 'Injection' ? 'selected' : ''}>${t('injectionFormat')}</option>
          <option value="Inhaler" ${editingMed?.format === 'Inhaler' ? 'selected' : ''}>${t('inhalerFormat')}</option>
        </select>
      </div>
      <button class="btn" onclick="window.saveMed()" ontouchstart="window.saveMed()">${t('saveMedication')}</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="window.closeMedPanel()" ontouchstart="window.closeMedPanel()">${t('cancel')}</button>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">${t('yourMedications')}</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="window.openAddMedPanel()" ontouchstart="window.openAddMedPanel()">${t('addBtn')}</button>
      </div>
      <div class="card-list">
        ${listHtml || `<div class="empty-state">${t('noMedsFound')}</div>`}
      </div>
    </div>
  `;
}

window.openAddMedPanel = () => { 
  state.showAddMedPanel = true; 
  state.editingMedId = null; 
  window.render(); 
};
window.closeMedPanel = () => { 
  state.showAddMedPanel = false; 
  state.editingMedId = null; 
  window.render(); 
};
window.editMed = (id) => { 
  state.editingMedId = id; 
  state.showAddMedPanel = false;
  window.render(); 
};
