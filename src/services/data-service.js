import { state } from '../state.js';
import { API } from '../db.js';
import { t } from '../utils.js';

export async function loadData() {
  state.medications = await API.getMedications();
  state.logs = await API.getLogs();
  state.metrics = await API.getMetrics();
  state.plans = await API.getPlans();
  
  // Load local databases
  try {
    const medRes = await fetch('/drugs.json');
    if (medRes.ok) state.localDrugs = await medRes.json();
    
    const docRes = await fetch('/doctors.json');
    if (docRes.ok) state.doctors = await docRes.json();
  } catch(e) { console.warn("Failed to load local DBs", e); }
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
  
  let advEvents = state.pendingAdverseEvents;
  const med = { id: id || undefined, name, dose, unit, format, hersteller, einsatzgebiet, adverse_events: advEvents };
  await API.addMedication(med);
  state.editingMedId = null;
  state.showAddMedPanel = false;
  state.pendingAdverseEvents = null;
  await loadData();
  window.render();
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
  if (state.planType === 'appointment') {
    const doctorName = document.getElementById('appt-doctor').value;
    const location = document.getElementById('appt-region').value;
    const specialty = document.getElementById('appt-specialty').value;
    const phone = document.getElementById('appt-phone').value;
    const note = document.getElementById('appt-note').value;
    const dateVal = document.getElementById('appt-date').value;

    if (!doctorName || !dateVal) return alert(t('nameAndDose'));

    await API.addPlan({
      type: 'appointment',
      doctorName,
      location,
      specialty,
      phone,
      note,
      startDate: dateVal.split('T')[0],
      startTime: dateVal.split('T')[1],
      isOneTime: true
    });
  } else {
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
  }

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

window.searchMedicationLocal = (query) => {
  const listEl = document.getElementById('med-local-results');
  if (!query || query.length < 2) {
    if (listEl) listEl.style.display = 'none';
    return;
  }
  const results = state.localDrugs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  if (results.length > 0) {
    listEl.style.display = 'block';
    listEl.innerHTML = results.map(m => `
      <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;" onclick="window.applyLocalDrug(${JSON.stringify(m).replace(/"/g, '&quot;')})">
        <div style="font-weight:700; color:var(--accent-color);">${m.name}</div>
        <div style="font-size:10px; opacity:0.6;">${m.generic_name}</div>
      </div>
    `).join('');
  } else {
    listEl.style.display = 'none';
  }
};

window.applyLocalDrug = (drug) => {
  document.getElementById('med-name').value = drug.name;
  document.getElementById('med-dose').value = drug.default_dose || "";
  document.getElementById('med-unit').value = drug.unit || "mg";
  document.getElementById('med-format').value = drug.format || "Pill";
  document.getElementById('med-hersteller').value = drug.hersteller || "";
  document.getElementById('med-einsatzgebiet').value = drug.einsatzgebiet || drug.generic_name || "";
  document.getElementById('med-local-results').style.display = 'none';
};

window.searchDoctorLocal = (query) => {
  const listEl = document.getElementById('doctor-local-results');
  if (!query || query.length < 2) {
    if (listEl) listEl.style.display = 'none';
    return;
  }
  const results = state.doctors.filter(d => 
    d.name.toLowerCase().includes(query.toLowerCase()) || 
    d.specialty.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  if (results.length > 0) {
    listEl.style.display = 'block';
    listEl.innerHTML = results.map(d => `
      <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;" onclick="window.applyLocalDoctor(${JSON.stringify(d).replace(/"/g, '&quot;')})">
        <div style="font-weight:700; color:var(--accent-color);">${d.name}</div>
        <div style="font-size:10px; opacity:0.6;">${d.specialty} • ${d.address}</div>
      </div>
    `).join('');
  } else {
    listEl.style.display = 'none';
  }
};

window.applyLocalDoctor = (doc) => {
  document.getElementById('appt-doctor').value = doc.name;
  document.getElementById('appt-specialty').value = doc.specialty;
  document.getElementById('appt-region').value = doc.address;
  document.getElementById('appt-phone').value = doc.phone || "";
  document.getElementById('doctor-local-results').style.display = 'none';
};

window._geolocate = (inputId) => {
  const el = document.getElementById(inputId);
  if (!navigator.geolocation) return alert('No geo');
  el.placeholder = t('locating');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
      const data = await res.json();
      el.value = data.address.city || data.address.town || data.address.village || '';
    } catch (e) { alert(t('locErr')); }
    finally { el.placeholder = t('regionPlaceholder'); }
  }, () => { alert(t('locErr')); el.placeholder = t('regionPlaceholder'); });
};

window.generateTestData = async () => {
  const meds = [
    { name: 'Ibuprofen', dose: '400', unit: 'mg', format: 'Pill' },
    { name: 'Pantoprazol', dose: '20', unit: 'mg', format: 'Pill' }
  ];
  for (const m of meds) await API.addMedication(m);
  await loadData();
  window.render();
  alert('Test data generated');
};

window.clearTestData = async () => {
  await API.clearTestData();
  await loadData();
  window.render();
};
