import './style.css';
import { API } from './db.js';
import { Html5Qrcode } from 'html5-qrcode';

// --- App State ---
const state = {
  currentView: 'dashboard',
  medications: [],
  logs: [],
  metrics: [],
  plans: [],
  html5QrCode: null
};

// --- DOM ---
const appDiv = document.getElementById('app');

// --- Main App Logic ---
async function loadData() {
  state.medications = await API.getMedications();
  state.logs = await API.getLogs();
  state.metrics = await API.getMetrics();
  state.plans = await API.getPlans();
}

window.navigate = async (view) => {
  // Cleanup
  if (state.html5QrCode && state.currentView === 'scanner') {
      try { await state.html5QrCode.stop(); } catch(e) {}
  }
  
  if (view !== 'settings') {
     state.currentView = view;
  }
  await loadData();
  render();
  
  // Post-render attachments
  if (view === 'scanner') {
    initScanner();
  }
};

function render() {
  appDiv.innerHTML = `
    <div class="header">
      <div>
        <div class="text-h1">MedicaTrack</div>
        <div class="text-body">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>
      <button class="header-action" onclick="window.navigate('settings')">Data & Exports</button>
    </div>
    
    <div id="view-container" class="page">
      ${getViewHTML()}
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="window.navigate('dashboard')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        Home
      </div>
      <div class="nav-item ${state.currentView === 'medications' ? 'active' : ''}" onclick="window.navigate('medications')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg>
        Meds
      </div>
      <div class="nav-item ${state.currentView === 'log' ? 'active' : ''}" onclick="window.navigate('log')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        Log Action
      </div>
      <div class="nav-item ${state.currentView === 'plans' ? 'active' : ''}" onclick="window.navigate('plans')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        Plans
      </div>
      <div class="nav-item ${state.currentView === 'scanner' ? 'active' : ''}" onclick="window.navigate('scanner')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z"/></svg>
        Scan
      </div>
    </div>
  `;
}

function getViewHTML() {
  switch(state.currentView) {
    case 'dashboard': return renderDashboard();
    case 'medications': return renderMedications();
    case 'plans': return renderPlans();
    case 'log': return renderLog();
    case 'scanner': return renderScanner();
    case 'settings': return renderSettings();
    default: return renderDashboard();
  }
}

// === VIEWS ===

// 1. Dashboard
function renderDashboard() {
  // get today's logs
  const today = new Date().setHours(0,0,0,0);
  const todaysLogs = state.logs.filter(l => new Date(l.timestamp).setHours(0,0,0,0) === today).reverse();
  const latestWeight = state.metrics.filter(m => m.type === 'weight').sort((a,b) => b.timestamp - a.timestamp)[0];

  let scheduleHtml = state.plans.length > 0 ? state.plans.map(p => {
     const med = state.medications.find(m => m.id === p.medicationId) || {name: 'Unknown'};
     const isCompleted = todaysLogs.some(l => l.medicationId === p.medicationId);
     const statusColor = isCompleted ? 'var(--accent-color)' : '#ef4444';
     const statusText = isCompleted ? '✓ Completed' : '• Due Today';
     const opacity = isCompleted ? '0.6' : '1';
     return `<div class="card" style="border-left: 4px solid ${statusColor}; opacity: ${opacity}; margin-bottom: 8px;">
               <div>
                 <div class="card-title">${med.name}</div>
                 <div class="card-subtitle">Scheduled: ${p.timeOfDay} | ${p.dose} ${med.unit || 'units'}</div>
               </div>
               <div style="color: ${statusColor}; font-size: 13px; font-weight: 600;">${statusText}</div>
             </div>`;
  }).join('') : `<div class="empty-state">No scheduled plans. Set one up in the Plans tab!</div>`;

  let logsHtml = todaysLogs.length ? todaysLogs.map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || {name: 'Unknown'};
    return `<div class="card">
              <div>
                <div class="card-title">${med.name}</div>
                <div class="card-subtitle">${l.amount_taken} ${med.unit || 'units'} taken</div>
              </div>
              <div class="text-secondary" style="font-size: 14px;">${new Date(l.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>`;
  }).join('') : `<div class="empty-state">No medications logged yet today.</div>`;

  return `
    <div class="glass-panel">
      <div class="text-h2">Due Today</div>
      <div class="card-list">
        ${scheduleHtml}
      </div>
    </div>

    <div class="glass-panel">
      <div class="text-h2">Logged Activity</div>
      <div class="card-list">
        ${logsHtml}
      </div>
    </div>
    
    <div class="glass-panel">
      <div class="text-h2">Recent Metrics</div>
      ${latestWeight ? `
        <div class="card">
          <div>
            <div class="card-title">Weight</div>
            <div class="card-subtitle">${new Date(latestWeight.timestamp).toLocaleDateString()}</div>
          </div>
          <div class="text-h2" style="margin:0; color: var(--accent-color);">${latestWeight.value} kg</div>
        </div>
      ` : `<div class="empty-state">No metrics logged yet.</div>`}
    </div>
  `;
}

// 2. Medications
function renderMedications() {
  let listHtml = state.medications.map(m => `
    <div class="card">
      <div>
        <div class="card-title">${m.name}</div>
        <div class="card-subtitle">Default: ${m.dose} ${m.unit} | Format: ${m.format}</div>
        ${m.barcode ? `<div class="card-subtitle" style="font-size: 11px; margin-top:4px;">Barcode: ${m.barcode}</div>` : ''}
      </div>
      <button class="btn btn-danger" style="padding: 8px 12px; width: auto;" onclick="window.deleteMed('${m.id}')">Delete</button>
    </div>
  `).join('');

  if (!state.medications.length) listHtml = `<div class="empty-state">No medications found. Log one to start!</div>`;

  return `
    <div class="glass-panel" id="add-med-panel" style="display: none;">
      <div class="text-h2">Add Medication</div>
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="med-name" placeholder="E.g., Aspirin">
      </div>
      <div style="display: flex; gap: 12px;">
        <div class="form-group" style="flex:1;">
          <label>Default Dose</label>
          <input type="number" id="med-dose" placeholder="E.g., 500">
        </div>
        <div class="form-group" style="flex:1;">
          <label>Unit</label>
          <select id="med-unit">
             <option value="mg">mg</option>
             <option value="ml">ml</option>
             <option value="pills">pill(s)</option>
             <option value="units">units</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Format</label>
        <select id="med-format">
           <option value="Pill">Pill</option>
           <option value="Liquid">Liquid</option>
           <option value="Injection">Injection</option>
           <option value="Inhaler">Inhaler</option>
        </select>
      </div>
      <div class="form-group">
        <label>Barcode (Optional)</label>
        <input type="text" id="med-barcode" placeholder="Scan or enter barcode">
      </div>
      <button class="btn" onclick="window.saveMed()">Save Medication</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="document.getElementById('add-med-panel').style.display='none'">Cancel</button>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">Your Medications</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="document.getElementById('add-med-panel').style.display='block'">+ Add</button>
      </div>
      <div class="card-list">
        ${listHtml}
      </div>
    </div>
  `;
}

// 2.5 Plans
function renderPlans() {
  const medOptions = state.medications.map(m => `<option value="${m.id}" data-dose="${m.dose}">${m.name}</option>`).join('');

  let listHtml = state.plans.map(p => {
    const med = state.medications.find(m => m.id === p.medicationId) || {name: 'Unknown'};
    return `<div class="card" style="align-items: flex-start;">
      <div>
        <div class="card-title">${med.name}</div>
        <div class="card-subtitle">Takes ${p.dose} ${med.unit || 'units'} at ${p.timeOfDay}</div>
        <button class="btn btn-secondary" style="padding: 6px 10px; width: auto; font-size: 11px; margin-top: 8px; border-color: #64748b; color: #cbd5e1" onclick="window.downloadICS('${p.id}')">+ Apple Calendar</button>
      </div>
      <button class="btn btn-danger" style="padding: 8px 12px; width: auto;" onclick="window.deletePlan('${p.id}')">Remove</button>
    </div>`;
  }).join('');

  if (!state.plans.length) listHtml = `<div class="empty-state">No daily schedule set.</div>`;

  return `
    <div class="glass-panel" id="add-plan-panel" style="display: none;">
      <div class="text-h2">Create Schedule</div>
      ${state.medications.length === 0 ? `<div class="empty-state">Add a medication first.</div>` : `
      <div class="form-group">
        <label>Select Medication</label>
        <select id="plan-med" onchange="document.getElementById('plan-dose').value = this.options[this.selectedIndex].getAttribute('data-dose')">
           <option value="" disabled selected>-- Choose --</option>
           ${medOptions}
        </select>
      </div>
      <div style="display: flex; gap: 12px;">
        <div class="form-group" style="flex:1;">
          <label>Time of Day</label>
          <input type="time" id="plan-time" required>
        </div>
        <div class="form-group" style="flex:1;">
          <label>Dose</label>
          <input type="number" id="plan-dose">
        </div>
      </div>
      <button class="btn" onclick="window.savePlan()">Save Plan</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="document.getElementById('add-plan-panel').style.display='none'">Cancel</button>
      `}
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">Your Schedule</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="document.getElementById('add-plan-panel').style.display='block'">+ New</button>
      </div>
      <div class="card-list">
        ${listHtml}
      </div>
    </div>
  `;
}

// 3. Activity Log
function renderLog() {
  const medOptions = state.medications.map(m => `<option value="${m.id}" data-dose="${m.dose}">${m.name}</option>`).join('');
  
  return `
    <div class="glass-panel">
      <div class="text-h2">Log Medication Intake</div>
      ${state.medications.length === 0 ? `<div class="empty-state">Please add a medication first.</div>` : `
        <div class="form-group">
          <label>Select Medication</label>
          <select id="log-med" onchange="document.getElementById('log-amount').value = this.options[this.selectedIndex].getAttribute('data-dose')">
             <option value="" disabled selected>-- Choose --</option>
             ${medOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Amount Taken</label>
          <input type="number" id="log-amount" placeholder="Quantity">
        </div>
        <button class="btn" onclick="window.saveLog()">Record Intake</button>
      `}
    </div>

    <div class="glass-panel">
      <div class="text-h2">Log Body Metric</div>
      <div class="form-group">
        <label>Metric Type</label>
        <select id="metric-type">
           <option value="weight">Body Weight (kg)</option>
           <option value="bp">Blood Pressure (mmHg)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Value</label>
        <input type="text" id="metric-value" placeholder="e.g., 75.5 or 120/80">
      </div>
      <button class="btn" onclick="window.saveMetric()">Save Metric</button>
    </div>
  `;
}

// 4. Scanner
function renderScanner() {
  return `
    <div class="glass-panel">
      <div class="text-h2">Scan Drug Package</div>
      <p class="text-body" style="margin-bottom: 20px;">Use your camera to scan EAN or UPC barcodes from your medication packaging.</p>
      
      <div id="reader"></div>
      <div id="scan-result" style="margin-top: 20px;"></div>
    </div>
  `;
}

function initScanner() {
  state.html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: { width: 250, height: 100 }, aspectRatio: 1.0 };
  
  state.html5QrCode.start(
    { facingMode: "environment" }, 
    config,
    async (decodedText, decodedResult) => {
      // stop on success
      await state.html5QrCode.stop();
      
      const el = document.getElementById("scan-result");
      const matchedMed = await API.getMedicationByBarcode(decodedText);
      
      if (matchedMed) {
        el.innerHTML = `
          <div class="card" style="border-color: var(--accent-color);">
            <div>
              <div class="card-title">Found: ${matchedMed.name}</div>
              <div class="card-subtitle">Barcode: ${decodedText}</div>
            </div>
            <button class="btn" onclick="window.quickLog('${matchedMed.id}', '${matchedMed.dose}')" style="width: auto; padding: 8px 16px;">Quick Log</button>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="card">
            <div>
              <div class="card-title">Unknown Drug</div>
              <div class="card-subtitle">Barcode: ${decodedText}</div>
            </div>
            <button class="btn" onclick="window.addFromScan('${decodedText}')" style="width: auto; padding: 8px 16px;">Add New</button>
          </div>
        `;
      }
    },
    (errorMessage) => {
      // parse errors are normal, ignore.
    }
  ).catch(err => {
    document.getElementById("scan-result").innerHTML = `<div style="color:red;">Error accessing camera. Please ensure permissions are granted.</div>`;
  });
}

// 5. Settings / Export
function renderSettings() {
  return `
    <div class="glass-panel">
      <div class="text-h2">Data Management</div>
      <p class="text-body" style="margin-bottom: 20px;">Your data is completely private and stored locally. **If you delete the app or clear your browser data, everything will be lost.** Export your data regularly!</p>
      
      <button class="btn" style="margin-bottom: 16px;" onclick="window.exportData()">Export Data (Backup)</button>
      
      <div style="border-top: 1px solid var(--glass-border); margin: 20px 0;"></div>
      
      <div class="text-h2">Restore Data</div>
      <input type="file" id="import-file" accept=".json" style="margin-bottom: 12px;">
      <button class="btn btn-secondary" onclick="window.importData()">Import / Restore</button>
      <div id="settings-msg" style="margin-top: 12px; color: var(--accent-color);"></div>
    </div>
  `;
}

// === GLOBALS EXPOSED FOR HTML ===

window.saveMed = async () => {
  const name = document.getElementById('med-name').value;
  const dose = document.getElementById('med-dose').value;
  const unit = document.getElementById('med-unit').value;
  const format = document.getElementById('med-format').value;
  const barcode = document.getElementById('med-barcode').value;
  
  if (!name || !dose) return alert("Name and dose required");
  
  await API.addMedication({ name, dose, unit, format, barcode });
  window.navigate('medications');
};

window.deleteMed = async (id) => {
  if(confirm("Delete this medication?")) {
    await API.deleteMedication(id);
    window.navigate('medications');
  }
};

window.saveLog = async () => {
  const medicationId = document.getElementById('log-med').value;
  const amount = document.getElementById('log-amount').value;
  
  if (!medicationId || !amount) return alert("Select medication and provide amount");
  
  await API.addLog({ medicationId, amount_taken: amount });
  window.navigate('dashboard');
};

window.quickLog = async (medId, amount) => {
  await API.addLog({ medicationId: medId, amount_taken: amount });
  alert("Logged successfully!");
  window.navigate('dashboard');
}

window.addFromScan = (barcode) => {
  window.navigate('medications');
  setTimeout(() => {
    document.getElementById('add-med-panel').style.display='block';
    document.getElementById('med-barcode').value = barcode;
  }, 100);
}

window.savePlan = async () => {
  const medicationId = document.getElementById('plan-med').value;
  const timeOfDay = document.getElementById('plan-time').value;
  const dose = document.getElementById('plan-dose').value;
  
  if (!medicationId || !timeOfDay) return alert("Medication and time required");
  
  await API.addPlan({ medicationId, timeOfDay, dose });
  window.navigate('plans');
};

window.deletePlan = async (id) => {
  if(confirm("Remove this schedule?")) {
    await API.deletePlan(id);
    window.navigate('plans');
  }
};

window.downloadICS = (id) => {
  const plan = state.plans.find(p => p.id === id);
  const med = state.medications.find(m => m.id === plan.medicationId);
  if (!plan || !med) return;

  const now = new Date();
  const timeParts = plan.timeOfDay.split(':');
  
  const dtStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(timeParts[0]), parseInt(timeParts[1]));
  
  const pad = n => n<10 ? '0'+n : n;
  const dtString = `${dtStart.getFullYear()}${pad(dtStart.getMonth()+1)}${pad(dtStart.getDate())}T${pad(dtStart.getHours())}${pad(dtStart.getMinutes())}00`;
  
  const icsStr = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:MedicaTrack: Take ${med.name}
DESCRIPTION:Time to take ${plan.dose} ${med.unit || 'units'} of ${med.name}.
DTSTART:${dtString}
RRULE:FREQ=DAILY
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:MedicaTrack Reminder
TRIGGER:-PT0M
END:VALARM
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsStr], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reminder_${med.name}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

window.saveMetric = async () => {
  const type = document.getElementById('metric-type').value;
  const value = document.getElementById('metric-value').value;
  
  if (!value) return alert("Value required");
  
  await API.addMetric({ type, value });
  window.navigate('dashboard');
};

window.exportData = async () => {
  const jsonString = await API.exportData();
  const blob = new Blob([jsonString], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `medicatrack_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};

window.importData = async () => {
  const fileInput = document.getElementById('import-file');
  if(!fileInput.files.length) return alert("Select a file first.");
  
  const file = fileInput.files[0];
  const text = await file.text();
  
  try {
    await API.importData(text);
    document.getElementById('settings-msg').innerText = "Data restored successfully!";
    setTimeout(() => window.navigate('dashboard'), 1500);
  } catch(e) {
    alert("Error reading backup file.");
  }
};

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error("SW Registration failed", err));
  }
  window.navigate('dashboard');
});
