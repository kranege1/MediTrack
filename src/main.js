import './style.css';
import { API } from './db.js';

// --- App State ---
const state = {
  currentView: 'dashboard',
  medications: [],
  logs: [],
  metrics: [],
  plans: [],
  fdaTimeout: null,
  pendingAdverseEvents: null,
  editingMedId: null,
  lang: localStorage.getItem('medilang') || 'en'
};
const _wikiSummaryCache = new Map();

// === i18n ===
const i18n = {
  en: {
    dataExports:'Data & Exports', home:'Home', meds:'Meds', logAction:'Log Action', plans:'Plans',
    dueToday:'Due Today', noPlans:'No scheduled plans. Set one up in the Plans tab!',
    loggedActivity:'Logged Activity', noLogsToday:'No medications logged yet today.',
    recentMetrics:'Recent Metrics', noMetrics:'No metrics logged yet.',
    scheduled:'Scheduled', completed:'✓ Completed', dueTodayBadge:'• Due Today', taken:'taken', weight:'Weight',
    addMedication:'Add Medication', nameLbl:'Name', defaultDose:'Default Dose', unitLbl:'Unit', formatLbl:'Format',
    saveMedication:'Save Medication', cancel:'Cancel', yourMedications:'Your Medications',
    noMedsFound:'No medications found. Add one to start!', delete:'Delete', addBtn:'+ Add',
    viewSideEffects:'⚠️ View Side Effects', translateAdverse:'🌐 Translate to German',
    createSchedule:'Create Schedule', selectMed:'Select Medication', timeOfDay:'Time of Day',
    dose:'Dose', savePlan:'Save Plan', yourSchedule:'Your Schedule',
    noSchedule:'No daily schedule set.', remove:'Remove', newPlan:'+ New',
    takes:'Takes', at:'at', appleCalendar:'+ Apple Calendar', chooseOption:'-- Choose --',
    addMedFirst:'Add a medication first.',
    logIntake:'Log Medication Intake', addMedFirst2:'Please add a medication first.',
    amountTaken:'Amount Taken', quantity:'Quantity', recordIntake:'Record Intake',
    logMetric:'Log Body Metric', metricType:'Metric Type', bodyWeight:'Body Weight (kg)',
    bloodPressure:'Blood Pressure (mmHg)', valueLbl:'Value', saveMetric:'Save Metric',
    dataManagement:'Data Management',
    dataNote:'Your data is completely private and stored locally. If you delete the app or clear your browser data, everything will be lost. Export your data regularly!',
    exportData:'Export Data (Backup)', restoreData:'Restore Data', importRestore:'Import / Restore',
    nameAndDose:'Name and dose required', selectAndAmount:'Select medication and provide amount',
    enterIngredient:'Enter an active ingredient name first.', medAndTime:'Medication and time required',
    queryingFDA:'Querying FDA database...', noBrandTrying:'No brand match — trying active ingredient...',
    searchingWiki:'Searching Wikipedia for active ingredients...',
    genericMatch:'Generic match', viaWiki:'📚 Via Wikipedia', doses:'Doses',
    notFoundFDA:'Not found in FDA, Wikipedia, or generic databases.',
    saveAsTypedBtn:'Save "{n}" as typed', linkIngredient:'Optional: link active ingredient to pull FDA data',
    ingredientPlaceholder:'e.g. Rosuvastatin', fetchBtn:'Fetch',
    adverseLabel:'⚠️ Main Adverse Events:', adverseVia:'⚠️ Main Adverse Events (via {ing}):',
    notFoundFDAShort:'Not found in FDA either.',
    deleteMedConfirm:'Delete this medication?', loggedSuccess:'Logged successfully!',
    removeScheduleConfirm:'Remove this schedule?', valueRequired:'Value required',
    selectFile:'Select a file first.', restoredSuccess:'Data restored successfully!',
    importError:'Error reading backup file.', lookupFailed:'Lookup failed. Check your connection.',
    wikiIngredientFound:'Wikipedia identified active ingredient: {ing}', translating:'Translating...',
    unknown:'Unknown', units:'units', pillUnit:'pill(s)', kg:'kg',
    pillFormat:'Pill', liquidFormat:'Liquid', injectionFormat:'Injection', inhalerFormat:'Inhaler',
    detailsBtn:'Details', editBtn:'Edit', updateMedication:'Edit Medication',
    wikiSummary:'Wikipedia Summary', readMore:'Full Article'
  },
  de: {
    dataExports:'Daten & Export', home:'Start', meds:'Medikamente', logAction:'Einnahme', plans:'Pläne',
    dueToday:'Heute fällig', noPlans:'Keine Pläne vorhanden. Erstelle einen Plan!',
    loggedActivity:'Heutige Aktivität', noLogsToday:'Noch keine Einnahme heute.',
    recentMetrics:'Letzte Messwerte', noMetrics:'Noch keine Messwerte eingetragen.',
    scheduled:'Geplant', completed:'✓ Eingenommen', dueTodayBadge:'• Heute fällig', taken:'eingenommen', weight:'Gewicht',
    addMedication:'Medikament hinzufügen', nameLbl:'Name', defaultDose:'Standarddosis', unitLbl:'Einheit', formatLbl:'Format',
    saveMedication:'Medikament speichern', cancel:'Abbrechen', yourMedications:'Ihre Medikamente',
    noMedsFound:'Keine Medikamente gefunden. Fügen Sie eines hinzu!', delete:'Löschen', addBtn:'+ Hinzufügen',
    viewSideEffects:'⚠️ Nebenwirkungen', translateAdverse:'🌐 Auf Deutsch übersetzen',
    createSchedule:'Plan erstellen', selectMed:'Medikament wählen', timeOfDay:'Uhrzeit',
    dose:'Dosis', savePlan:'Plan speichern', yourSchedule:'Ihr Tagesplan',
    noSchedule:'Kein Tagesplan erstellt.', remove:'Entfernen', newPlan:'+ Neu',
    takes:'Nimmt', at:'um', appleCalendar:'+ Apple Kalender', chooseOption:'-- Bitte wählen --',
    addMedFirst:'Zuerst ein Medikament hinzufügen.',
    logIntake:'Einnahme erfassen', addMedFirst2:'Bitte zuerst ein Medikament hinzufügen.',
    amountTaken:'Eingenommene Menge', quantity:'Menge', recordIntake:'Einnahme speichern',
    logMetric:'Körpermesswert erfassen', metricType:'Messtyp', bodyWeight:'Körpergewicht (kg)',
    bloodPressure:'Blutdruck (mmHg)', valueLbl:'Wert', saveMetric:'Messwert speichern',
    dataManagement:'Datenverwaltung',
    dataNote:'Ihre Daten sind vollständig privat und lokal gespeichert. Beim Löschen der App gehen alle Daten verloren. Exportieren Sie Ihre Daten regelmäßig!',
    exportData:'Daten exportieren (Sicherung)', restoreData:'Daten wiederherstellen', importRestore:'Importieren / Wiederherstellen',
    nameAndDose:'Name und Dosis erforderlich', selectAndAmount:'Bitte Medikament und Menge angeben',
    enterIngredient:'Bitte zuerst einen Wirkstoffnamen eingeben.', medAndTime:'Medication and time required',
    queryingFDA:'FDA-Datenbank wird abgefragt...', noBrandTrying:'Kein Markenname — suche nach Wirkstoff...',
    searchingWiki:'Wikipedia wird nach Wirkstoffen durchsucht...',
    genericMatch:'Wirkstoff-Treffer', viaWiki:'📚 Via Wikipedia', doses:'Dosen',
    notFoundFDA:'Nicht in FDA, Wikipedia oder Wirkstoffdatenbank gefunden.',
    saveAsTypedBtn:'\u201e{n}\u201c so speichern', linkIngredient:'Optional: Wirkstoff eingeben für FDA-Daten',
    ingredientPlaceholder:'z.B. Rosuvastatin', fetchBtn:'Abrufen',
    adverseLabel:'⚠️ Hauptnebenwirkungen:', adverseVia:'⚠️ Hauptnebenwirkungen (via {ing}):',
    notFoundFDAShort:'Auch in FDA nicht gefunden.',
    deleteMedConfirm:'Medikament löschen?', loggedSuccess:'Erfolgreich eingetragen!',
    removeScheduleConfirm:'Tagesplan entfernen?', valueRequired:'Wert erforderlich',
    selectFile:'Bitte zuerst eine Datei wählen.', restoredSuccess:'Daten erfolgreich wiederhergestellt!',
    importError:'Fehler beim Lesen der Sicherungsdatei.', lookupFailed:'Suche fehlgeschlagen. Verbindung prüfen.',
    wikiIngredientFound:'Wikipedia hat Wirkstoff gefunden: {ing}', translating:'Übersetze...',
    unknown:'Unbekannt', units:'Einheiten', pillUnit:'Pille(n)', kg:'kg',
    pillFormat:'Pille', liquidFormat:'Flüssigkeit', injectionFormat:'Injektion', inhalerFormat:'Inhalator',
    detailsBtn:'Details', editBtn:'Bearbeiten', updateMedication:'Medikament bearbeiten',
    wikiSummary:'Wikipedia-Zusammenfassung', readMore:'Vollständiger Artikel'
  }
};
const t = (key) => (i18n[state.lang] || i18n.en)[key] || key;
const _advTransCache = new Map(); // session cache for translated adverse events

// Automatic translation helper
window._autoTranslateAdverse = async (text) => {
  if (state.lang !== 'de' || !text) return text;
  try {
    const encoded = encodeURIComponent(text.substring(0, 450));
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|de`);
    const d = await r.json();
    return d.responseData ? d.responseData.translatedText : text;
  } catch(e) { return text; }
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
  if (view !== 'settings') {
     state.currentView = view;
  }
  await loadData();
  render();
};

function render() {
  appDiv.innerHTML = `
    <div class="header">
      <div>
        <div class="text-h1">MedicaTrack <span style="font-size: 14px; color: var(--accent-color); vertical-align: top;">v4.3</span></div>
        <div class="text-body">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <div style="display:flex; border:1px solid rgba(255,255,255,0.15); border-radius:8px; overflow:hidden; font-size:12px; font-weight:700;">
          <button onclick="window.toggleLang('en')" style="padding:5px 10px; background:${state.lang==='en'?'var(--accent-color)':'transparent'}; color:${state.lang==='en'?'#000':'#94a3b8'}; border:none; cursor:pointer;">EN</button>
          <button onclick="window.toggleLang('de')" style="padding:5px 10px; background:${state.lang==='de'?'var(--accent-color)':'transparent'}; color:${state.lang==='de'?'#000':'#94a3b8'}; border:none; cursor:pointer;">DE</button>
        </div>
        <button class="header-action" onclick="window.navigate('settings')">${t('dataExports')}</button>
      </div>
    </div>
    
    <div id="view-container" class="page">
      ${getViewHTML()}
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="window.navigate('dashboard')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        ${t('home')}
      </div>
      <div class="nav-item ${state.currentView === 'medications' ? 'active' : ''}" onclick="window.navigate('medications')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg>
        ${t('meds')}
      </div>
      <div class="nav-item ${state.currentView === 'log' ? 'active' : ''}" onclick="window.navigate('log')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        ${t('logAction')}
      </div>
      <div class="nav-item ${state.currentView === 'plans' ? 'active' : ''}" onclick="window.navigate('plans')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        ${t('plans')}
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
     const med = state.medications.find(m => m.id === p.medicationId) || {name: t('unknown')};
     const isCompleted = todaysLogs.some(l => l.medicationId === p.medicationId);
     const statusColor = isCompleted ? 'var(--accent-color)' : '#ef4444';
     const statusText = isCompleted ? t('completed') : t('dueTodayBadge');
     const opacity = isCompleted ? '0.6' : '1';
     return `<div class="card" style="border-left: 4px solid ${statusColor}; opacity: ${opacity}; margin-bottom: 8px;">
               <div>
                 <div class="card-title">${med.name}</div>
                 <div class="card-subtitle">${t('scheduled')}: ${p.timeOfDay} | ${p.dose} ${med.unit || t('units')}</div>
               </div>
               <div style="color: ${statusColor}; font-size: 13px; font-weight: 600;">${statusText}</div>
             </div>`;
  }).join('') : `<div class="empty-state">${t('noPlans')}</div>`;

  let logsHtml = todaysLogs.length ? todaysLogs.map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || {name: t('unknown')};
    return `<div class="card">
              <div>
                <div class="card-title">${med.name}</div>
                <div class="card-subtitle">${l.amount_taken} ${med.unit || t('units')} ${t('taken')}</div>
              </div>
              <div class="text-secondary" style="font-size: 14px;">${new Date(l.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>`;
  }).join('') : `<div class="empty-state">${t('noLogsToday')}</div>`;

  return `
    <div class="glass-panel">
      <div class="text-h2">${t('dueToday')}</div>
      <div class="card-list">
        ${scheduleHtml}
      </div>
    </div>

    <div class="glass-panel">
      <div class="text-h2">${t('loggedActivity')}</div>
      <div class="card-list">
        ${logsHtml}
      </div>
    </div>
    
    <div class="glass-panel">
      <div class="text-h2">${t('recentMetrics')}</div>
      ${latestWeight ? `
        <div class="card">
          <div>
            <div class="card-title">${t('weight')}</div>
            <div class="card-subtitle">${new Date(latestWeight.timestamp).toLocaleDateString()}</div>
          </div>
          <div class="text-h2" style="margin:0; color: var(--accent-color);">${latestWeight.value} ${t('kg')}</div>
        </div>
      ` : `<div class="empty-state">${t('noMetrics')}</div>`}
    </div>
  `;
}

// 2. Medications
function renderMedications() {
  let listHtml = state.medications.map(m => {
    // Build avatar: deterministic coloured initial pill
    const initials = m.name.substring(0, 2).toUpperCase();
    const hue = [...m.name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
    const avatar = `<div style="width:52px; height:52px; border-radius:10px; background:hsl(${hue},55%,35%); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:white; flex-shrink:0;">${initials}</div>`;
    return `
    <div class="card" style="align-items: flex-start; gap: 12px;">
      <div style="display:flex; gap:12px; align-items:flex-start; flex:1; min-width:0;">
        ${avatar}
        <div style="flex:1; min-width:0;">
          <div class="card-title">${m.name}</div>
          <div class="card-subtitle">${t('scheduled')}: ${m.dose} ${m.unit} | ${t('formatLbl')}: ${m.format}</div>
          ${m.adverse_events ? `
              <div style="margin-top: 8px;">
                 <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; width: auto; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="document.getElementById('adv-${m.id}').style.display = document.getElementById('adv-${m.id}').style.display === 'none' ? 'block' : 'none'">${t('viewSideEffects')}</button>
                 ${state.lang === 'de' ? `<button onclick="window.translateAdverse('${m.id}', '${m.adverse_events.replace(/'/g, ' ').replace(/"/g, ' ')}')" style="font-size:11px; padding: 4px 8px; background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.4); border-radius:6px; cursor:pointer; margin-left:6px;">${t('translateAdverse')}</button>` : ''}
                 <div id="adv-${m.id}" style="display:none; margin-top: 6px; font-size: 11px; color: #f87171; background: rgba(0,0,0,0.2); border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 6px; line-height: 1.4;">${m.adverse_events}</div>
              </div>
          ` : ''}
          <div id="wiki-${m.id}" style="display:none; margin-top: 10px; font-size: 13px; color: #cbd5e1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; line-height: 1.5;"></div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px; width: 100%; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
         <button class="btn btn-secondary" style="padding: 8px; flex: 1; font-size:12px;" onclick="window.showDetails('${m.id}', '${m.name}')">${t('detailsBtn')}</button>
         <button class="btn btn-secondary" style="padding: 8px; flex: 1; font-size:12px;" onclick="window.editMed('${m.id}')">${t('editBtn')}</button>
         <button class="btn btn-danger" style="padding: 8px; flex: 0.5; font-size:12px;" onclick="window.deleteMed('${m.id}')">${t('delete')}</button>
      </div>
    </div>`;
  }).join('');

  if (!state.medications.length) listHtml = `<div class="empty-state">${t('noMedsFound')}</div>`;

  return `
    <div class="glass-panel" id="add-med-panel" style="display: none;">
      <div class="text-h2" id="add-med-title">${t('addMedication')}</div>
      <input type="hidden" id="med-id">
      <div class="form-group" style="position: relative;">
        <label>${t('nameLbl')}</label>
        <input type="text" id="med-name" placeholder="E.g., Aspirin" autocomplete="off" oninput="window.searchFDA(this.value)">
        <div id="fda-dropdown" style="position: absolute; top: 100%; left: 0; right: 0; background: #0f172a; border: 1px solid var(--accent-color); border-radius: 8px; z-index: 50; display: none; max-height: 200px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"></div>
        <div id="med-fda-adverse" style="display:none; margin-top: 8px; font-size: 11px; color: #f87171; background: rgba(0,0,0,0.2); border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 6px; line-height: 1.4;"></div>
      </div>
      <div style="display: flex; gap: 12px;">
        <div class="form-group" style="flex:1;">
          <label>${t('defaultDose')}</label>
          <input type="text" id="med-dose" placeholder="E.g., 500">
        </div>
        <div class="form-group" style="flex:1;">
          <label>${t('unitLbl')}</label>
          <select id="med-unit">
             <option value="mg">mg</option>
             <option value="ml">ml</option>
             <option value="pills">${t('pillUnit')}</option>
             <option value="units">${t('units')}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>${t('formatLbl')}</label>
        <select id="med-format">
           <option value="Pill">${t('pillFormat')}</option>
           <option value="Liquid">${t('liquidFormat')}</option>
           <option value="Injection">${t('injectionFormat')}</option>
           <option value="Inhaler">${t('inhalerFormat')}</option>
        </select>
      </div>
      <button class="btn" id="med-save-btn" onclick="window.saveMed()">${t('saveMedication')}</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="window.closeMedPanel()">${t('cancel')}</button>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">${t('yourMedications')}</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="window.openAddMedPanel()">${t('addBtn')}</button>
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
    const med = state.medications.find(m => m.id === p.medicationId) || {name: t('unknown')};
    return `<div class="card" style="align-items: flex-start;">
      <div>
        <div class="card-title">${med.name}</div>
        <div class="card-subtitle">${t('takes')} ${p.dose} ${med.unit || t('units')} ${t('at')} ${p.timeOfDay}</div>
        <button class="btn btn-secondary" style="padding: 6px 10px; width: auto; font-size: 11px; margin-top: 8px; border-color: #64748b; color: #cbd5e1" onclick="window.downloadICS('${p.id}')">${t('appleCalendar')}</button>
      </div>
      <button class="btn btn-danger" style="padding: 8px 12px; width: auto;" onclick="window.deletePlan('${p.id}')">${t('remove')}</button>
    </div>`;
  }).join('');

  if (!state.plans.length) listHtml = `<div class="empty-state">${t('noSchedule')}</div>`;

  return `
    <div class="glass-panel" id="add-plan-panel" style="display: none;">
      <div class="text-h2">${t('createSchedule')}</div>
      ${state.medications.length === 0 ? `<div class="empty-state">${t('addMedFirst')}</div>` : `
      <div class="form-group">
        <label>${t('selectMed')}</label>
        <select id="plan-med" onchange="document.getElementById('plan-dose').value = this.options[this.selectedIndex].getAttribute('data-dose')">
           <option value="" disabled selected>${t('chooseOption')}</option>
           ${medOptions}
        </select>
      </div>
      <div style="display: flex; gap: 12px;">
        <div class="form-group" style="flex:1;">
          <label>${t('timeOfDay')}</label>
          <input type="time" id="plan-time" required>
        </div>
        <div class="form-group" style="flex:1;">
          <label>${t('dose')}</label>
          <input type="number" id="plan-dose">
        </div>
      </div>
      <button class="btn" onclick="window.savePlan()">${t('savePlan')}</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="document.getElementById('add-plan-panel').style.display='none'">${t('cancel')}</button>
      `}
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">${t('yourSchedule')}</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="document.getElementById('add-plan-panel').style.display='block'">${t('newPlan')}</button>
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
      <div class="text-h2">${t('logIntake')}</div>
      ${state.medications.length === 0 ? `<div class="empty-state">${t('addMedFirst2')}</div>` : `
        <div class="form-group">
          <label>${t('selectMed')}</label>
          <select id="log-med" onchange="document.getElementById('log-amount').value = this.options[this.selectedIndex].getAttribute('data-dose')">
             <option value="" disabled selected>${t('chooseOption')}</option>
             ${medOptions}
          </select>
        </div>
        <div class="form-group">
          <label>${t('amountTaken')}</label>
          <input type="number" id="log-amount" placeholder="${t('quantity')}">
        </div>
        <button class="btn" onclick="window.saveLog()">${t('recordIntake')}</button>
      `}
    </div>

    <div class="glass-panel">
      <div class="text-h2">${t('logMetric')}</div>
      <div class="form-group">
        <label>${t('metricType')}</label>
        <select id="metric-type">
           <option value="weight">${t('bodyWeight')}</option>
           <option value="bp">${t('bloodPressure')}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${t('valueLbl')}</label>
        <input type="text" id="metric-value" placeholder="e.g., 75.5 or 120/80">
      </div>
      <button class="btn" onclick="window.saveMetric()">${t('saveMetric')}</button>
    </div>
  `;
}


// 5. Settings / Export
function renderSettings() {
  return `
    <div class="glass-panel">
      <div class="text-h2">${t('dataManagement')}</div>
      <p class="text-body" style="margin-bottom: 20px;">${t('dataNote')}</p>
      
      <button class="btn" style="margin-bottom: 16px;" onclick="window.exportData()">${t('exportData')}</button>
      
      <div style="border-top: 1px solid var(--glass-border); margin: 20px 0;"></div>
      
      <div class="text-h2">${t('restoreData')}</div>
      <input type="file" id="import-file" accept=".json" style="margin-bottom: 12px;">
      <button class="btn btn-secondary" onclick="window.importData()">${t('importRestore')}</button>
      <div id="settings-msg" style="margin-top: 12px; color: var(--accent-color);"></div>
    </div>
  `;
}

// === GLOBALS EXPOSED FOR HTML ===

window.saveMed = async () => {
  const id = document.getElementById('med-id').value;
  const name = document.getElementById('med-name').value;
  const dose = document.getElementById('med-dose').value;
  const unit = document.getElementById('med-unit').value;
  const format = document.getElementById('med-format').value;
  
  if (!name || !dose) return alert(t('nameAndDose'));
  
  // Use existing data if editing, or fetch if new/changed
  let advEvents = state.pendingAdverseEvents;

  if (id) {
    const existing = state.medications.find(m => m.id === id);
    if (existing && existing.name === name) {
      if (!advEvents) advEvents = existing.adverse_events;
    }
  }
  
  await API.addMedication({ id: id || undefined, name, dose, unit, format, adverse_events: advEvents });
  window.closeMedPanel();
  window.navigate('medications');
};

window.editMed = (id) => {
  const med = state.medications.find(m => m.id === id);
  if (!med) return;
  
  state.editingMedId = id;
  document.getElementById('med-id').value = id;
  document.getElementById('med-name').value = med.name;
  document.getElementById('med-dose').value = med.dose;
  document.getElementById('med-unit').value = med.unit;
  document.getElementById('med-format').value = med.format;
  
  document.getElementById('add-med-title').innerText = t('updateMedication');
  document.getElementById('med-save-btn').innerText = t('saveMedication');
  document.getElementById('add-med-panel').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openAddMedPanel = () => {
  window.closeMedPanel();
  document.getElementById('add-med-panel').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.closeMedPanel = () => {
  state.editingMedId = null;
  state.pendingAdverseEvents = null;
  document.getElementById('med-id').value = '';
  document.getElementById('med-name').value = '';
  document.getElementById('med-dose').value = '';
  document.getElementById('add-med-title').innerText = t('addMedication');
  document.getElementById('add-med-panel').style.display = 'none';
  const advEl = document.getElementById('med-fda-adverse');
  if (advEl) advEl.style.display = 'none';
};

window.showDetails = async (id, name) => {
  const el = document.getElementById('wiki-' + id);
  if (el.style.display === 'block') {
    el.style.display = 'none';
    return;
  }
  
  if (_wikiSummaryCache.has(name)) {
    el.innerHTML = _wikiSummaryCache.get(name);
    el.style.display = 'block';
    return;
  }

  el.innerHTML = t('translating');
  el.style.display = 'block';

  try {
    // 1. Search for title
    const lang = state.lang === 'de' ? 'de' : 'en';
    const s = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' drug')}&format=json&origin=*&srlimit=1`);
    const sd = await s.json();
    if (!sd.query.search.length) {
      el.innerHTML = "No detailed information found.";
      return;
    }
    const title = sd.query.search[0].title;

    // 2. Get extract
    const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`);
    const d = await r.json();
    const pages = d.query.pages;
    const page = pages[Object.keys(pages)[0]];
    const extract = page.extract || "No summary available.";
    
    const html = `
      <div style="font-weight:700; margin-bottom:8px; color:var(--accent-color);">${t('wikiSummary')}</div>
      <div>${extract.substring(0, 600)}${extract.length > 600 ? '...' : ''}</div>
      <a href="https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}" target="_blank" style="display:inline-block; margin-top:12px; color:var(--accent-color); text-decoration:none; font-weight:600; border-bottom:1px solid var(--accent-color);">${t('readMore')} →</a>
    `;
    _wikiSummaryCache.set(name, html);
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = "Failed to load details.";
  }
};

window.deleteMed = async (id) => {
  if(confirm(t('deleteMedConfirm'))) {
    await API.deleteMedication(id);
    window.navigate('medications');
  }
};


window.saveLog = async () => {
  const medicationId = document.getElementById('log-med').value;
  const amount = document.getElementById('log-amount').value;
  
  if (!medicationId || !amount) return alert(t('selectAndAmount'));
  
  await API.addLog({ medicationId, amount_taken: amount });
  window.navigate('dashboard');
};

window.quickLog = async (medId, amount) => {
  await API.addLog({ medicationId: medId, amount_taken: amount });
  alert(t('loggedSuccess'));
  window.navigate('dashboard');
}


window.savePlan = async () => {
  const medicationId = document.getElementById('plan-med').value;
  const timeOfDay = document.getElementById('plan-time').value;
  const dose = document.getElementById('plan-dose').value;
  
  if (!medicationId || !timeOfDay) return alert(t('medAndTime'));
  
  await API.addPlan({ medicationId, timeOfDay, dose });
  window.navigate('plans');
};

window.deletePlan = async (id) => {
  if(confirm(t('removeScheduleConfirm'))) {
    await API.deletePlan(id);
    window.navigate('plans');
  }
};

window.searchFDA = (query) => {
  state.pendingAdverseEvents = null;
  if (state.fdaTimeout) clearTimeout(state.fdaTimeout);
  const dropdown = document.getElementById('fda-dropdown');
  
  if (query.length < 3) {
      dropdown.style.display = 'none';
      return;
  }
  
  dropdown.innerHTML = `<div style="padding: 12px; font-size: 13px; color: var(--accent-color);">${t('queryingFDA')}</div>`;
  dropdown.style.display = 'block';

  state.fdaTimeout = setTimeout(async () => {
    try {
      // === PASS 1: FDA brand name ===
      const res1 = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}*"&limit=5`);
      const data1 = await res1.json();
      if (data1.results && data1.results.length > 0) {
        dropdown.innerHTML = window._fdaResultsHTML(data1.results, 'brand');
        return;
      }

      // === PASS 2: FDA generic / active ingredient name ===
      dropdown.innerHTML = `<div style="padding: 12px; font-size: 13px; color: var(--accent-color);">${t('noBrandTrying')}</div>`;
      const res2 = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(query)}*"&limit=5`);
      const data2 = await res2.json();
      if (data2.results && data2.results.length > 0) {
        dropdown.innerHTML = window._fdaResultsHTML(data2.results, 'generic');
        return;
      }

      // === PASS 3: Wikipedia ingredient extraction — then re-query FDA ===
      dropdown.innerHTML = `<div style="padding: 12px; font-size: 13px; color: var(--accent-color);">${t('searchingWiki')}</div>`;
      const ingredients = await window._wikiExtractIngredients(query);

      if (ingredients.length === 0) {
        dropdown.innerHTML = window._notFoundHTML(query);
        return;
      }

      // Try each extracted ingredient against FDA until we get results
      let wikiResults = [];
      let matchedIngredient = '';
      for (const ing of ingredients) {
        const res3 = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(ing)}*"&limit=5`);
        const data3 = await res3.json();
        if (data3.results && data3.results.length > 0) {
          wikiResults = data3.results;
          matchedIngredient = ing;
          break;
        }
      }

      if (wikiResults.length > 0) {
        dropdown.innerHTML =
          `<div style="padding: 8px 12px; font-size: 11px; color: #a5b4fc; background: rgba(99,102,241,0.1); border-bottom: 1px solid rgba(99,102,241,0.2);">` +
          `${t('wikiIngredientFound').replace('{ing}', `<strong>${matchedIngredient}</strong>`)}</div>` +
          window._fdaResultsHTML(wikiResults, 'wiki');
      } else {
        dropdown.innerHTML = window._notFoundHTML(query);
      }
    } catch(e) {
        dropdown.innerHTML = `<div style="padding: 12px; font-size: 13px; color: #94a3b8;">${t('lookupFailed')}</div>`;
    }
  }, 500);
};

window.toggleLang = (lang) => {
  state.lang = lang;
  localStorage.setItem('medilang', lang);
  render();
};

// Translate adverse events text via MyMemory API (free, no key, CORS-safe)
window.translateAdverse = async (medId, text) => {
  const el = document.getElementById('adv-' + medId);
  if (!el) return;
  if (_advTransCache.has(medId)) {
    el.innerHTML = _advTransCache.get(medId);
    el.style.display = 'block';
    return;
  }
  el.style.display = 'block';
  el.innerHTML = 'Übersetze...';
  try {
    const encoded = encodeURIComponent(text.substring(0, 450));
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|de`);
    const d = await r.json();
    const translated = d.responseData ? d.responseData.translatedText : text;
    _advTransCache.set(medId, translated);
    el.innerHTML = translated;
  } catch(e) {
    el.innerHTML = text;
  }
};

// Pass 3 helper: query Wikipedia and extract pharmaceutical ingredient names
window._wikiExtractIngredients = async (query) => {
  try {
    // Step 1: find the Wikipedia article
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' drug')}&format=json&origin=*&srlimit=3`
    );
    const searchData = await searchRes.json();
    if (!searchData.query.search.length) return [];

    // Step 2: fetch the article intro text
    const title = searchData.query.search[0].title;
    const extractRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&titles=${encodeURIComponent(title)}&format=json&origin=*&exsentences=10&explaintext=1`
    );
    const extractData = await extractRes.json();
    const pages = extractData.query.pages;
    const page = pages[Object.keys(pages)[0]];
    if (!page || !page.extract) return [];

    const text = page.extract;

    // Step 3: extract names using common pharmaceutical suffixes
    const pharmaRx = /\b([A-Z][a-z]{2,}(?:statin|pril|sartan|olol|xaban|tidine|mide|prazole|zine|mycin|cycline|cillin|mab|nib|zumab|ximab|tide|zide|fenac|profen|codone|phine|methasone|sone|lone|dine|pine|azole|oxide|amine|bine|vir|lukast|dronate|setron|gliptin|gliflozin|tide|tide|urea|fibrate|ezetimibe|mibe))\b/g;
    const matches = [...text.matchAll(pharmaRx)];
    const extracted = [...new Set(matches.map(m => m[1]))];

    // Also scan for explicit active ingredient mentions
    const activeRx = /active ingredient[s]?[^.]{0,80}?(\b[A-Z][a-z]{4,}\b)/gi;
    const activeMatches = [...text.matchAll(activeRx)];
    activeMatches.forEach(m => { if (m[1]) extracted.unshift(m[1]); });

    return [...new Set(extracted)].slice(0, 5);
  } catch(e) {
    return [];
  }
};

window._fdaResultsHTML = (results, matchType) => {
  return results.map(r => {
    let brand = 'Unknown Brand';
    let generic = '';
    if (r.openfda && r.openfda.brand_name) brand = r.openfda.brand_name[0];
    if (r.openfda && r.openfda.generic_name) generic = r.openfda.generic_name[0];

    let adverseRaw = '';
    if (r.adverse_reactions && r.adverse_reactions.length > 0) {
      adverseRaw = r.adverse_reactions[0];
      adverseRaw = adverseRaw.replace(/^[0-9]+(\.[0-9]+)?\s*ADVERSE REACTIONS\s*/i, '');
    }
    let adverseText = adverseRaw.replace(/'/g, ' ').replace(/"/g, ' ').replace(/\n/g, ' ');
    if (adverseText.length > 250) adverseText = adverseText.substring(0, 250) + '...';

    let doseStr = '';
    let doseUnit = 'mg';
    let doseBlob = (r.dosage_and_administration || []).join(' ') + ' ' + (r.active_ingredient || []).join(' ');
    let doseMatches = [...doseBlob.matchAll(/\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|ug|g)\b/ig)];
    if (doseMatches.length > 0) {
       let uniqueDoses = [...new Set(doseMatches.map(m => m[1]))];
       doseStr = uniqueDoses.slice(0, 4).sort((a, b) => parseFloat(a) - parseFloat(b)).join(', ');
       const unitCounts = {};
       doseMatches.forEach(m => { const u = m[2].toLowerCase(); unitCounts[u] = (unitCounts[u] || 0) + 1; });
       doseUnit = Object.entries(unitCounts).sort((a, b) => b[1] - a[1])[0][0];
    }

    const badges = {
      'generic': `<span style="font-size: 10px; background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.4); border-radius: 4px; padding: 1px 5px; margin-left: 6px;">${t('genericMatch')}</span>`,
      'wiki':    `<span style="font-size: 10px; background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.4); border-radius: 4px; padding: 1px 5px; margin-left: 6px;">📚 Via Wikipedia</span>`,
      'brand':   ''
    };
    const badge = badges[matchType] || '';

    return `<div style="padding: 12px; border-bottom: 1px solid var(--glass-border); cursor: pointer; transition: background 0.2s;"
                 onclick="window.selectFDA('${brand}', '${adverseText}', '${doseStr}', '${doseUnit}')"
                 onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                 onmouseout="this.style.background='transparent'">
               <div style="font-weight: bold; color: white;">${brand}${badge}</div>
               <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">${generic}${doseStr ? ' | ' + t('doses') + ': ' + doseStr + ' ' + doseUnit : ''}</div>
             </div>`;
  }).join('');
};


window.selectFDA = (brand, adverseEvents, doseStr, doseUnit) => {
  document.getElementById('med-name').value = brand;
  document.getElementById('fda-dropdown').style.display = 'none';
  
  if (doseStr && doseStr !== 'undefined' && doseStr.trim() !== '') {
      document.getElementById('med-dose').value = doseStr;
      if (doseUnit && doseUnit !== 'undefined') {
        const unitSelect = document.getElementById('med-unit');
        const match = [...unitSelect.options].find(o => o.value === doseUnit);
        if (match) unitSelect.value = doseUnit;
      }
  }
  
  const adverseEl = document.getElementById('med-fda-adverse');
  if (adverseEvents && adverseEvents !== 'undefined' && adverseEvents.trim() !== '') {
      state.pendingAdverseEvents = adverseEvents;
      adverseEl.style.display = 'block';
      adverseEl.innerHTML = `<strong>${t('adverseLabel')}</strong><br>${adverseEvents}`;

      // Auto-translate if DE
      if (state.lang === 'de') {
        adverseEl.innerHTML = `<strong>${t('adverseLabel')}</strong><br>${t('translating')}`;
        window._autoTranslateAdverse(adverseEvents).then(trans => {
           state.pendingAdverseEvents = trans;
           adverseEl.innerHTML = `<strong>${t('adverseLabel')}</strong><br>${trans}`;
        });
      }
  } else {
      state.pendingAdverseEvents = null;
      adverseEl.style.display = 'none';
  }
  // Kick off background image fetch
  state.pendingImageUrl = null;
  window._fetchDrugImage(brand).then(url => { state.pendingImageUrl = url; });
};

// Build the "not found" fallback panel in the dropdown
window._notFoundHTML = (query) => {
  const safeQuery = query.replace(/'/g, ' ').replace(/"/g, ' ');
  return `
    <div style="padding: 14px;">
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">⚠️ ${t('notFoundFDA')}</div>
      <button onclick="window.saveAsTyped('${safeQuery}')" style="width:100%; padding:9px 12px; background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.4); border-radius: 8px; font-size: 13px; font-weight: 600; cursor:pointer; margin-bottom: 10px;">${t('saveAsTypedBtn').replace('{n}', safeQuery)}</button>
      <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${t('linkIngredient')}</div>
      <div style="display:flex; gap:6px;">
        <input id="fda-ingredient-input" type="text" placeholder="${t('ingredientPlaceholder')}" style="flex:1; padding:7px 10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:white; font-size:12px;">
        <button onclick="window.fetchFDAIngredient('${safeQuery}')" style="padding:7px 12px; background:var(--accent-color); color:#000; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">${t('fetchBtn')}</button>
      </div>
    </div>`;
};

// "Save as typed" — close dropdown, set name, fetch image
window.saveAsTyped = (name) => {
  document.getElementById('med-name').value = name;
  document.getElementById('fda-dropdown').style.display = 'none';
  state.pendingAdverseEvents = null;
};

// Fetch FDA data for a manually entered ingredient, keep the brand name
window.fetchFDAIngredient = async (brandName) => {
  const ing = (document.getElementById('fda-ingredient-input') || {}).value;
  if (!ing || ing.trim().length < 3) return alert(t('enterIngredient'));
  const res = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(ing.trim())}*"&limit=1`);
  const data = await res.json();
  if (!data.results || !data.results.length) return alert(`"${ing}" — ${t('notFoundFDAShort')}`);
  const r = data.results[0];
  let adverseRaw = '';
  if (r.adverse_reactions && r.adverse_reactions.length > 0) {
    adverseRaw = r.adverse_reactions[0].replace(/^[0-9]+(\.[0-9]+)?\s*ADVERSE REACTIONS\s*/i, '');
  }
  let adverseText = adverseRaw.replace(/'/g, ' ').replace(/"/g, ' ').replace(/\n/g, ' ');
  if (adverseText.length > 250) adverseText = adverseText.substring(0, 250) + '...';
  let doseStr = '';
  let doseUnit = 'mg';
  let doseBlob = (r.dosage_and_administration || []).join(' ') + ' ' + (r.active_ingredient || []).join(' ');
  let doseMatches = [...doseBlob.matchAll(/\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|ug|g)\b/ig)];
  if (doseMatches.length > 0) {
    let uniqueDoses = [...new Set(doseMatches.map(m => m[1]))];
    doseStr = uniqueDoses.slice(0, 4).sort((a, b) => parseFloat(a) - parseFloat(b)).join(', ');
    const uc = {}; doseMatches.forEach(m => { const u = m[2].toLowerCase(); uc[u] = (uc[u]||0)+1; });
    doseUnit = Object.entries(uc).sort((a,b) => b[1]-a[1])[0][0];
  }
  document.getElementById('med-name').value = brandName;
  document.getElementById('fda-dropdown').style.display = 'none';
  if (doseStr) {
    document.getElementById('med-dose').value = doseStr;
    const unitSelect = document.getElementById('med-unit');
    const m = [...unitSelect.options].find(o => o.value === doseUnit);
    if (m) unitSelect.value = doseUnit;
  }
  const adverseEl = document.getElementById('med-fda-adverse');
  if (adverseText.trim()) {
      state.pendingAdverseEvents = adverseText;
      adverseEl.style.display = 'block';
      adverseEl.innerHTML = `<strong>${t('adverseVia').replace('{ing}', ing)}</strong><br>${adverseText}`;
      
      // Auto-translate if DE
      if (state.lang === 'de') {
        const origHtml = adverseEl.innerHTML;
        adverseEl.innerHTML = `<strong>${t('adverseVia').replace('{ing}', ing)}</strong><br>${t('translating')}`;
        window._autoTranslateAdverse(adverseText).then(trans => {
           state.pendingAdverseEvents = trans;
           adverseEl.innerHTML = `<strong>${t('adverseVia').replace('{ing}', ing)}</strong><br>${trans}`;
        });
      }
  }
  state.pendingAdverseEvents = null;
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
  
  if (!value) return alert(t('valueRequired'));
  
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
  if(!fileInput.files.length) return alert(t('selectFile'));
  
  const file = fileInput.files[0];
  const text = await file.text();
  
  try {
    await API.importData(text);
    document.getElementById('settings-msg').innerText = t('restoredSuccess');
    setTimeout(() => window.navigate('dashboard'), 1500);
  } catch(e) {
    alert(t('importError'));
  }
};

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error("SW Registration failed", err));
  }
  window.navigate('dashboard');
});
