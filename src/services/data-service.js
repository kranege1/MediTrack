import { state } from '../state.js';
import { API } from '../db.js';
import { t } from '../utils.js';

export async function loadData() {
  state.medications = await API.getMedications();
  state.logs = await API.getLogs();
  state.metrics = await API.getMetrics();
  state.plans = await API.getPlans();
}

export async function saveMed() {
  const id = document.getElementById('med-id').value;
  const name = document.getElementById('med-name').value;
  const dose = document.getElementById('med-dose').value;
  const unit = document.getElementById('med-unit').value;
  const format = document.getElementById('med-format').value;
  const hersteller = document.getElementById('med-hersteller').value;
  const einsatzgebiet = document.getElementById('med-einsatzgebiet').value;
  
  if (!name || !dose) return alert(t('nameAndDose'));
  
  const med = { id: id || undefined, name, dose, unit, format, hersteller, einsatzgebiet };
  await API.addMedication(med);
  state.editingMedId = null;
  state.showAddMedPanel = false;
  await loadData();
  render();
}

export async function deleteMed(id) {
  if (confirm(t('deleteMedConfirm'))) {
    await API.deleteMedication(id);
    await loadData();
    render();
  }
}

export async function confirmIntake(planId, plannedDateISO) {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;

  await API.addLog({
    medicationId: plan.medicationId,
    planId: plan.id,
    plannedDate: plannedDateISO,
    status: 'taken',
    amount_taken: plan.dose,
    timestamp: Date.now()
  });

  await loadData();
  render();
}

export async function skipIntake(planId, plannedDateISO) {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;

  await API.addLog({
    medicationId: plan.medicationId,
    planId: plan.id,
    plannedDate: plannedDateISO,
    status: 'skipped',
    amount_taken: 0,
    timestamp: Date.now()
  });

  await loadData();
  render();
}

export async function saveLog() {
  const medicationId = document.getElementById('log-med').value;
  const amount = document.getElementById('log-amount').value;
  const dateVal = document.getElementById('log-date').value;

  if (!medicationId || !amount) return alert(t('selectAndAmount'));

  const timestamp = dateVal ? new Date(dateVal).getTime() : Date.now();
  const logData = { medicationId, amount_taken: amount, timestamp };

  if (medicationId === 'custom') {
    const customName = document.getElementById('log-custom-name').value.trim();
    if (!customName) return alert(t('nameAndDose'));
    logData.medName = customName;
  }

  await API.addLog(logData);
  await loadData();
  window.navigate('dashboard');
}

export async function saveMetric() {
  const type = document.getElementById('metric-type').value;
  const value = document.getElementById('metric-value').value;
  const dateVal = document.getElementById('metric-date').value;
  if (!value) return alert(t('valueRequired'));
  
  const timestamp = dateVal ? new Date(dateVal).getTime() : Date.now();
  await API.addMetric({ type, value, timestamp });
  await loadData();
  window.navigate('dashboard');
}

export async function savePlan() {
  const medicationId = document.getElementById('plan-med').value;
  const timeCategory = document.getElementById('plan-time').value;
  const dose = document.getElementById('plan-dose').value;
  const startDate = document.getElementById('plan-start').value;

  if (!medicationId || !dose || !startDate) return alert(t('medAndTime'));

  await API.addPlan({
    medicationId,
    timeCategory,
    dose,
    startDate,
    frequency: 'daily'
  });

  state.showAddPlanPanel = false;
  await loadData();
  render();
}

export async function removePlan(id) {
  if (confirm(t('removeScheduleConfirm'))) {
    await API.deletePlan(id);
    await loadData();
    render();
  }
}

export function _handleLogMedChange(val) {
  const container = document.getElementById('log-custom-med-container');
  if (container) container.style.display = (val === 'custom') ? 'block' : 'none';
  
  if (val !== 'custom') {
    const med = state.medications.find(m => m.id === val);
    if (med) {
      document.getElementById('log-amount').value = med.dose;
    }
  }
}

export async function _deleteHistoryLog(id, type) {
  if (confirm(t('deleteMedConfirm'))) {
    if (type === 'metric') await API.deleteMetric(id);
    else await API.deleteLog(id);
    await loadData();
    window.render();
  }
}

// Expose to window
window.saveMed = saveMed;
window.deleteMed = deleteMed;
window.confirmIntake = confirmIntake;
window.skipIntake = skipIntake;
window.saveLog = saveLog;
window.saveMetric = saveMetric;
window.loadData = loadData;
window._handleLogMedChange = _handleLogMedChange;
window._deleteHistoryLog = _deleteHistoryLog;
window.savePlan = savePlan;
window.removePlan = removePlan;
