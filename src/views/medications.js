import { state } from '../state.js';
import { t } from '../utils.js';

export function renderMedications() {
  const formatIcons = { 'Pill': '💊', 'Liquid': '💧', 'Injection': '💉', 'Inhaler': '🌬️' };
  
  const showPanel = state.showAddMedPanel || state.editingMedId;
  const editingMed = state.editingMedId ? state.medications.find(m => m.id === state.editingMedId) : null;

  const editIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
  const deleteIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

  let listHtml = state.medications.map(m => `
    <div class="card" style="padding:16px; position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div style="display:flex; gap:14px; align-items:center;">
          <div style="font-size:26px; background:rgba(255,255,255,0.03); width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            ${formatIcons[m.format] || '💊'}
          </div>
          <div style="min-width:0;">
            <div class="card-title" style="font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</div>
            <div class="card-subtitle" style="font-size:12px; margin-top:2px;">${m.dose} ${m.unit} • ${t(m.format.toLowerCase() + 'Format') || m.format}</div>
            ${m.hersteller ? `<div style="font-size:10px; opacity:0.4; margin-top:4px; display:flex; align-items:center; gap:4px;">🏭 ${m.hersteller}</div>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:10px; background:rgba(255,255,255,0.05);" onclick="window.editMed('${m.id}')" ontouchstart="window.editMed('${m.id}')" title="${t('editBtn')}">
            ${editIcon}
          </button>
          <button class="btn btn-secondary" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:10px; border-color:rgba(248,113,113,0.3); color:#f87171; background:rgba(248,113,113,0.05);" onclick="window.deleteMed('${m.id}')" ontouchstart="window.deleteMed('${m.id}')" title="${t('delete')}">
            ${deleteIcon}
          </button>
        </div>
      </div>
      ${m.einsatzgebiet ? `<div style="font-size:10px; opacity:0.5; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); font-style:italic; display:flex; align-items:center; gap:4px;">📋 ${m.einsatzgebiet}</div>` : ''}
      <button class="btn btn-secondary" style="font-size: 10px; padding: 4px 10px; width: auto; background: rgba(239, 68, 68, 0.05); color: #f87171; border-color: rgba(239, 68, 68, 0.2); border-radius: 6px; margin-top:8px;" onclick="window.showAdverseOverlay('${m.id}')">${t('sideEffectsTitle')}</button>
    </div>
  `).join('');

  const medClasses = [...new Set(state.localDrugs.map(d => d.einsatzgebiet).filter(Boolean))].sort();

  return `
    <div class="glass-panel" id="add-med-panel" style="display: ${showPanel ? 'block' : 'none'};">
      <div class="text-h2" id="add-med-title">${state.editingMedId ? t('updateMedication') : t('addMedication')}</div>
      <input type="hidden" id="med-id" value="${state.editingMedId || ''}">
      
      <div class="form-group" style="position:relative;">
        <label>${t('nameLbl')}</label>
        <div style="display:flex; gap:8px;">
          <input type="text" id="med-name" value="${editingMed ? editingMed.name : ''}" placeholder="E.g., Aspirin" style="flex:1;" oninput="window.searchMedicationLocal(this.value)">
          <button class="btn btn-secondary" style="width:auto; padding:0 12px; font-size:12px; background:var(--accent-color); color:#000; border:none;" onclick="window.searchWithGrok()">✨ KI</button>
        </div>
        <div id="med-local-results" class="glass-panel" style="display:none; position:absolute; top:70px; left:0; right:0; z-index:100; padding:0; border:1px solid rgba(255,255,255,0.1); max-height:200px; overflow-y:auto;"></div>
      </div>

      <div class="form-group">
        <label>${t('quickSelectArea')}</label>
        <select onchange="window.searchByClass(this.value)">
           <option value="">${t('chooseArea')}</option>
           ${medClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>

      <div id="med-fda-adverse" style="margin-bottom:16px; display:none;"></div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label>${t('defaultDose')}</label>
          <input type="text" id="med-dose" value="${editingMed ? editingMed.dose : ''}" placeholder="500">
        </div>
        <div class="form-group">
          <label>${t('unitLbl')}</label>
          <select id="med-unit">
            <option value="mg" ${editingMed?.unit === 'mg' ? 'selected' : ''}>mg</option>
            <option value="ml" ${editingMed?.unit === 'ml' ? 'selected' : ''}>ml</option>
            <option value="${t('pillUnit')}" ${editingMed?.unit === t('pillUnit') ? 'selected' : ''}>${t('pillUnit')}</option>
          </select>
        </div>
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

      <div class="form-group">
        <label>${t('hersteller')}</label>
        <input type="text" id="med-hersteller" value="${editingMed?.hersteller || ''}" placeholder="Pfizer, Bayer...">
      </div>

      <div class="form-group">
        <label>${t('einsatzgebiet')}</label>
        <input type="text" id="med-einsatzgebiet" value="${editingMed?.einsatzgebiet || ''}" placeholder="Blutdruck, Schmerz...">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px;">
        <button class="btn" onclick="window.saveMed()" ontouchstart="window.saveMed()">${t('saveMedication')}</button>
        <button class="btn btn-secondary" onclick="window.closeMedPanel()" ontouchstart="window.closeMedPanel()">${t('cancel')}</button>
      </div>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="text-h2" style="margin: 0;">${t('yourMedications')}</div>
        <button class="btn" style="width: auto; padding: 10px 18px; font-size: 14px; background:var(--accent-color); color:#000; border:none; box-shadow: 0 4px 15px rgba(74,222,128,0.3);" onclick="window.openAddMedPanel()" ontouchstart="window.openAddMedPanel()">
          + ${t('medication')}
        </button>
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

window.searchByClass = (klasse) => {
  const listEl = document.getElementById('med-local-results');
  if (!klasse) {
    listEl.style.display = 'none';
    return;
  }
  const results = state.localDrugs.filter(d => d.einsatzgebiet === klasse);
  listEl.style.display = 'block';
  listEl.innerHTML = `
    <div style="padding:10px; font-size:10px; opacity:0.5; text-transform:uppercase;">${klasse}</div>
    ${results.map(m => `
      <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;" onclick="window.applyLocalDrug(${JSON.stringify(m).replace(/"/g, '&quot;')})">
        <div style="font-weight:700; color:var(--accent-color);">${m.name}</div>
        <div style="font-size:10px; opacity:0.6;">${m.generic_name}</div>
      </div>
    `).join('')}
  `;
};
