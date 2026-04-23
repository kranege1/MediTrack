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
  
  if (!name || !dose) return alert(t('nameAndDose'));
  
  const med = { id: id || undefined, name, dose, unit, format };
  await API.addMedication(med);
  state.editingMedId = null;
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

// Expose to window
window.saveMed = saveMed;
window.deleteMed = deleteMed;
window.confirmIntake = confirmIntake;
window.skipIntake = skipIntake;
window.saveLog = saveLog;
window.saveMetric = saveMetric;
window.loadData = loadData;
