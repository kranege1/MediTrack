import './style.css';
import { API } from './db.js';

// --- App State ---
window.state = {
  currentView: 'dashboard',
  medications: [],
  logs: [],
  metrics: [],
  plans: [],
  fdaTimeout: null,
  pendingAdverseEvents: null,
  editingMedId: null,
  lang: localStorage.getItem('medilang') || 'en',
  grokKey: localStorage.getItem('grok_api_key') || '',
  grokModel: localStorage.getItem('grok_model') || 'grok-4.20-non-reasoning',
  availableModels: JSON.parse(localStorage.getItem('grok_available_models') || '[]'),
  pendingGrokResults: [],
  historyView: 'list',
  analyticsRange: 7
};
const state = window.state;

const GROK_BASE_URL = "https://api.x.ai/v1/chat/completions";

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
    sideEffectsTitle:'⚠️ Side Effects', frequency:'Frequency', symptom:'Symptom', close:'Close',
    morning:'Morning', noon:'Noon', evening:'Evening',
    daily:'Daily', weekly:'Weekly', monthly:'Monthly', quarterly:'Quarterly', everyXDays:'Every X days',
    dayIntervalLbl:'Repeat every {x} days',
    searchStartpage:'🔍 Search on Startpage',
    searchAi:'🔍 AI Search',
    enteringApiKey:'Grok API Key',
    aiThinking:'Grok is thinking...',
    aiError:'Error during AI lookup.',
    settingsSavedLabel:'Settings Saved',
    saveSettingsBtn:'Save Settings',
    missingKeyError:'Please set your Grok API Key in Settings first.',
    testingKey:'Testing Key...',
    keyInvalid:'Key invalid',
    modelIdLabel:'Grok Model ID',
    modelSuggestion:'Try: grok-4.20-non-reasoning or grok-2',
    customModel:'Custom (enter manually)...',
    notFoundAiLabel:'Medication not found or unknown.',
    selectMatch:'Select a match:',
    multipleFound:'Multiple results found',
    history:'History',
    pulse:'Pulse',
    glucose:'Blood Glucose',
    linkMetrics:'Link body metrics with this schedule',
    pulseLabel:'Pulse (bpm)',
    glucoseLabel:'Blood Glucose (mg/dL)',
    deleteAllData:'Clear All Data',
    deleteLogs:'Clear Intake Logs Only',
    resetTodayLbl:'Reset Today\'s Progress',
    confirmDeleteAll:'CRITICAL: Wipe ALL data (meds, plans, logs)? This cannot be undone!',
    confirmDeleteLogs:'Delete all intake and metric history?',
    metricRequired:'Measurement Required',
    fillRequiredMetrics:'Please fill in the required health metrics.',
    anchorDate:'Start Date',
    startWeekday:'Weekday',
    dayOfMonth:'Day of Month',
    monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday',
    adHoc:'Ad-hoc',
    analytics:'Analytics',
    list:'List',
    charts:'Charts',
    adherence:'Adherence',
    trends:'Trends',
    last7Days:'Last 7 Days',
    last30Days:'Last 30 Days',
    lastYear:'Last Year',
    missed:'Missed'
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
    sideEffectsTitle:'⚠️ Nebenwirkungen', frequency:'Häufigkeit', symptom:'Symptom', close:'Schließen',
    morning:'Morgens', noon:'Mittags', evening:'Abends',
    daily:'Täglich', weekly:'Wöchentlich', monthly:'Monatlich', quarterly:'Vierteljährlich', everyXDays:'Alle X Tage',
    dayIntervalLbl:'Wiederhole alle {x} Tage',
    searchStartpage:'🔍 Auf Startpage suchen',
    searchAi:'🔍 KI-Suche',
    enteringApiKey:'Grok API-Key',
    aiThinking:'Grok denkt nach...',
    aiError:'Fehler bei der KI-Abfrage.',
    settingsSavedLabel:'Einstellungen gespeichert',
    saveSettingsBtn:'Einstellungen speichern',
    missingKeyError:'Bitte hinterlege zuerst deinen Grok API-Key in den Einstellungen.',
    testingKey:'Key wird geprüft...',
    keyInvalid:'Key ungültig',
    modelIdLabel:'Grok Modell ID',
    modelSuggestion:'Versuche: grok-4.20-non-reasoning oder grok-2',
    fetchingModels:'Modelle werden geladen...',
    refreshModels:'Modelle aktualisieren',
    customModel:'Benutzerdefiniert...',
    notFoundAiLabel:'Medikament nicht gefunden oder unbekannt.',
    selectMatch:'Bitte Treffer wählen:',
    multipleFound:'Mehrere Ergebnisse gefunden',
    history:'Historie',
    pulse:'Puls',
    glucose:'Blutzucker',
    linkMetrics:'Körpermesswerte mit diesem Plan verknüpfen',
    pulseLabel:'Puls (bpm)',
    glucoseLabel:'Blutzucker (mg/dL)',
    deleteAllData:'Alle Projektdaten löschen',
    deleteLogs:'Nur Einnahme-Log löschen',
    resetTodayLbl:'Heutigen Tagesplan zurücksetzen',
    confirmDeleteAll:'KRITISCH: ALLE Daten löschen (Medikamente, Pläne, Logs)? Dies kann nicht rückgängig gemacht werden!',
    confirmDeleteLogs:'Alle Einnahme- und Messwert-Historien löschen?',
    metricRequired:'Messung erforderlich',
    fillRequiredMetrics:'Bitte trage die erforderlichen Messwerte ein.',
    anchorDate:'Startdatum',
    startWeekday:'Wochentag',
    startDayOfMonth:'Tag des Monats',
    monday:'Montag', tuesday:'Dienstag', wednesday:'Mittwoch', thursday:'Donnerstag', friday:'Freitag', saturday:'Samstag', sunday:'Sonntag',
    adHoc:'Ad-hoc',
    analytics:'Statistik',
    list:'Liste',
    charts:'Diagramme',
    adherence:'Adhärenz',
    trends:'Trends',
    last7Days:'Letzte 7 Tage',
    last30Days:'Letzte 30 Tage',
    lastYear:'Letztes Jahr',
    missed:'Vergessen'
  }
};
const LOCAL_DRUG_KB = {
  'ezerosu': 'Rosuvastatin, Ezetimibe',
  'sortis': 'Atorvastatin',
  'crestor': 'Rosuvastatin',
  'pantozol': 'Pantoprazol',
  'pantoprazol': 'Pantoprazole',
  'voltaren': 'Diclofenac',
  'nexium': 'Esomeprazole',
  'ibumetin': 'Ibuprofen',
  'aspirin': 'Acetylsalicylic acid',
  'lasix': 'Furosemide',
  'concor': 'Bisoprolol',
  'beloc': 'Metoprolol',
  'xanax': 'Alprazolam',
  'mexalen': 'Paracetamol',
  'dafalgan': 'Paracetamol',
  'benuron': 'Paracetamol',
  'parkemed': 'Mefenamic acid'
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
  state.currentView = view;
  await loadData();
  render();
};

function render() {
  appDiv.innerHTML = `
    <div class="header">
      <div>
        <div class="text-h1">MedicaTrack <span style="font-size: 14px; color: var(--accent-color); vertical-align: top;">v4.30</span></div>
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
      <div class="nav-item ${state.currentView === 'plans' ? 'active' : ''}" onclick="window.navigate('plans')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        ${t('plans')}
      </div>
      <div class="nav-item ${state.currentView === 'history' ? 'active' : ''}" onclick="window.navigate('history')">
        <svg class="nav-icon" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        ${t('history')}
      </div>
    </div>
  `;

  if (state.currentView === 'history' && state.historyView === 'charts') {
    _initCharts();
  }
}

function getViewHTML() {
  switch(state.currentView) {
    case 'dashboard': return renderDashboard();
    case 'medications': return renderMedications();
    case 'plans': return renderPlans();
    case 'log': return renderLog();
    case 'history': return renderHistory();
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

  let scheduleHtml = state.plans.length > 0 ? state.plans.filter(window._isPlanDueToday).map(p => {
     const med = state.medications.find(m => m.id === p.medicationId) || {name: t('unknown')};
     const isCompleted = todaysLogs.some(l => l.medicationId === p.medicationId);
     const statusColor = isCompleted ? 'var(--accent-color)' : '#ef4444';
     const statusText = isCompleted ? t('completed') : t('dueTodayBadge');
     const opacity = isCompleted ? '0.6' : '1';
     return `<div class="card" style="border-left: 4px solid ${statusColor}; opacity: ${opacity}; margin-bottom: 8px; display: flex; flex-direction: column; padding: 16px;">
               <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                 <div style="flex: 1;">
                   <div class="card-title">${med.name}</div>
                   <div class="card-subtitle">${t('scheduled')}: ${t(p.timeCategory || 'morning')} | ${p.dose} ${med.unit || t('units')}</div>
                 </div>
                 <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                   <div style="color: ${statusColor}; font-size: 12px; font-weight: 600;">${statusText}</div>
                   ${!isCompleted ? `
                     <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; width: auto;" onclick="window.confirmIntake('${p.id}')">
                       ✓ ${t('completed')}
                     </button>
                   ` : ''}
                 </div>
               </div>
               ${!isCompleted && p.linkedMetrics && p.linkedMetrics.length > 0 ? `
                 <div id="metrics-entry-${p.id}" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
                   <div style="font-size: 10px; color: var(--accent-color); text-transform: uppercase; margin-bottom: 8px; font-weight: 700;">
                      ⚠️ ${t('metricRequired')}
                    </div>
                   <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                     ${p.linkedMetrics.map(type => `
                       <div class="form-group" style="margin-bottom:0;">
                         <input type="text" id="m-val-${p.id}-${type}" placeholder="${t(type === 'weight' ? 'weight' : (type === 'bp' ? 'bloodPressure' : type))}" style="padding: 6px; font-size: 11px; background: rgba(0,0,0,0.2);">
                       </div>
                     `).join('')}
                   </div>
                 </div>
               ` : ''}
             </div>`;
  }).join('') : `<div class="empty-state">${t('noPlans')}</div>`;

  if (state.plans.length > 0 && scheduleHtml === '') {
     scheduleHtml = `<div class="empty-state">${t('noPlans')}</div>`;
  }

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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin-bottom: 0;">${t('dueToday')}</div>
        <button class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 12px; border-color: var(--accent-color); color: var(--accent-color); background: rgba(99,102,241,0.05);" onclick="window.navigate('log')">
          + ${t('adHoc')}
        </button>
      </div>
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

window.confirmIntake = async (planId) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  
  const linkedMetricIds = [];
  if (plan.linkedMetrics) {
    let missing = false;
    for (const type of plan.linkedMetrics) {
      const input = document.getElementById(`m-val-${planId}-${type}`);
      const val = input?.value?.trim();
      if (!val) {
        if (input) input.style.borderColor = "#ef4444";
        missing = true;
      } else {
        if (input) input.style.borderColor = "rgba(255,255,255,0.1)";
        const metric = await API.addMetric({ type, value: val });
        linkedMetricIds.push(metric.id);
      }
    }
    if (missing) {
      alert(t('fillRequiredMetrics'));
      return;
    }
  }
  
  await API.addLog({
    medicationId: plan.medicationId,
    amount_taken: plan.dose,
    linkedMetricIds,
    timestamp: Date.now()
  });
  
  alert(t('loggedSuccess'));
  window.navigate('dashboard');
};

// 2. Medications
function renderMedications() {
  let listHtml = state.medications.map(m => {
    const formatIcons = {
      'Pill': '💊',
      'Liquid': '💧',
      'Injection': '💉',
      'Inhaler': '💨'
    };
    const icon = formatIcons[m.format] || '💊';
    const hue = [...m.name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
    
    // Avatar: Icon on top, small dose below
    const avatar = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0; width:64px;">
        <div style="width:52px; height:52px; border-radius:12px; background:hsl(${hue},55%,35%); display:flex; align-items:center; justify-content:center; font-size:24px; color:white; border:1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
          ${icon}
        </div>
        <div style="font-size:10px; font-weight:700; color:var(--accent-color); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">
          ${m.dose} ${m.unit}
        </div>
      </div>`;

    return `
    <div class="card" style="display: flex; flex-direction: column; align-items: stretch; padding: 16px; gap: 0;">
      <!-- Top Section: Avatar, Name and Actions -->
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        ${avatar}
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div class="card-title" style="margin-bottom: 2px; line-height: 1.2; word-break: break-all;">${m.name}</div>
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
               <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; border-color: rgba(255,255,255,0.1);" onclick="window.editMed('${m.id}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               </button>
               <button class="btn btn-danger" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1); border-radius: 8px;" onclick="window.deleteMed('${m.id}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
               </button>
            </div>
          </div>
          ${m.adverse_events ? `
              <div style="margin-top: 8px;">
                 <button class="btn btn-secondary" style="font-size: 10px; padding: 4px 10px; width: auto; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); border-radius: 6px;" onclick="window.showAdverseOverlay('${m.id}')">${t('sideEffectsTitle')}</button>
              </div>
          ` : ''}
        </div>
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
        <div style="display:flex; gap:8px;">
          <input type="text" id="med-name" placeholder="E.g., Aspirin" autocomplete="off" style="flex:1;">
          <button class="btn btn-secondary" style="width: auto; padding: 0 15px; background: rgba(99, 102, 241, 0.1); color: var(--accent-color); border: 1px solid rgba(99, 102, 241, 0.3);" onclick="window.searchWithGrok()">
            ${t('searchAi')}
          </button>
        </div>
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
    let freqText = t(p.frequency || 'daily');
    if (p.frequency === 'everyXDays') freqText = t('dayIntervalLbl').replace('{x}', p.intervalX);
    if (p.frequency === 'weekly' && p.startWeekday !== undefined) {
      const days = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
      freqText = `${t('weekly')} (${days[p.startWeekday]})`;
    }
    if ((p.frequency === 'monthly' || p.frequency === 'quarterly') && p.startDayOfMonth !== undefined) {
      freqText = `${t(p.frequency)} (${t('dayOfMonth')}: ${p.startDayOfMonth})`;
    }

    return `<div class="card" style="align-items: flex-start;">
      <div>
        <div class="card-title">${med.name}</div>
        <div class="card-subtitle">${t('takes')} ${p.dose} ${med.unit || t('units')} ${t('at')} <strong>${t(p.timeCategory || 'morning')}</strong></div>
        <div style="font-size: 11px; color: var(--accent-color); margin-top: 4px; font-weight: 600;">${freqText}</div>
        
        ${p.linkedMetrics && p.linkedMetrics.length > 0 ? `
          <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
            ${p.linkedMetrics.map(type => `
              <span style="font-size: 9px; padding: 2px 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: rgba(255,255,255,0.6);">
                ${t(type === 'weight' ? 'weight' : (type === 'bp' ? 'bloodPressure' : type))}
              </span>
            `).join('')}
          </div>
        ` : ''}

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
          <select id="plan-category">
             <option value="morning">${t('morning')}</option>
             <option value="noon">${t('noon')}</option>
             <option value="evening">${t('evening')}</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;">
          <label>${t('dose')}</label>
          <input type="number" id="plan-dose">
        </div>
      </div>

      <div class="form-group">
        <label>${t('frequency')}</label>
        <select id="plan-freq" onchange="window._handleFreqChange(this.value)">
           <option value="daily">${t('daily')}</option>
           <option value="weekly">${t('weekly')}</option>
           <option value="monthly">${t('monthly')}</option>
           <option value="quarterly">${t('quarterly')}</option>
           <option value="everyXDays">${t('everyXDays')}</option>
        </select>
      </div>

      <div class="form-group">
        <label>${t('anchorDate')}</label>
        <input type="date" id="plan-start-date" value="${new Date().toISOString().split('T')[0]}" onchange="window._syncPlanAnchors(this.value)">
      </div>

      <div id="plan-weekday-row" style="display:none;">
        <div class="form-group">
          <label>${t('startWeekday')}</label>
          <select id="plan-weekday">
            <option value="1">${t('monday')}</option>
            <option value="2">${t('tuesday')}</option>
            <option value="3">${t('wednesday')}</option>
            <option value="4">${t('thursday')}</option>
            <option value="5">${t('friday')}</option>
            <option value="6">${t('saturday')}</option>
            <option value="0">${t('sunday')}</option>
          </select>
        </div>
      </div>

      <div id="plan-day-month-row" style="display:none;">
        <div class="form-group">
          <label>${t('dayOfMonth')}</label>
          <input type="number" id="plan-day-of-month" min="1" max="31" value="${new Date().getDate()}">
        </div>
      </div>

      <div class="form-group" id="plan-x-days-row" style="display:none;">
        <label>${t('dayIntervalLbl').replace('{x}', 'X')}</label>
        <input type="number" id="plan-interval-x" value="2" min="2" max="30">
      </div>

      <div class="form-group" style="margin-top:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid var(--glass-border);">
        <label style="color:var(--accent-color); font-size:12px; text-transform:uppercase; margin-bottom:12px; display:block;">${t('linkMetrics')}</label>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:normal; cursor:pointer;">
            <input type="checkbox" name="link-metric" value="weight" style="width:18px; height:18px; accent-color:var(--accent-color);"> ${t('weight')}
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:normal; cursor:pointer;">
            <input type="checkbox" name="link-metric" value="bp" style="width:18px; height:18px; accent-color:var(--accent-color);"> ${t('bloodPressure')}
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:normal; cursor:pointer;">
            <input type="checkbox" name="link-metric" value="pulse" style="width:18px; height:18px; accent-color:var(--accent-color);"> ${t('pulse')}
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:normal; cursor:pointer;">
            <input type="checkbox" name="link-metric" value="glucose" style="width:18px; height:18px; accent-color:var(--accent-color);"> ${t('glucose')}
          </label>
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


function renderHistory() {
  return `
    <div style="padding: 16px 0; display: flex; gap: 8px; margin-bottom: 8px;">
      <button class="btn" style="flex:1; font-weight:700; height:44px; border-radius:12px; background:${state.historyView==='list'?'var(--accent-color)':'rgba(0,0,0,0.2)'}; color:${state.historyView==='list'?'#000':'#94a3b8'}; border:none;" onclick="window._setHistoryView('list')">${t('list')}</button>
      <button class="btn" style="flex:1; font-weight:700; height:44px; border-radius:12px; background:${state.historyView==='charts'?'var(--accent-color)':'rgba(0,0,0,0.2)'}; color:${state.historyView==='charts'?'#000':'#94a3b8'}; border:none;" onclick="window._setHistoryView('charts')">${t('charts')}</button>
    </div>
    ${state.historyView === 'list' ? _renderLogList() : renderAnalytics()}
  `;
}

function _renderLogList() {
  const allLogs = [...state.logs].sort((a,b) => b.timestamp - a.timestamp);
  const logCards = allLogs.map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || {name: t('unknown')};
    const time = new Date(l.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    
    let metricsHtml = '';
    if (l.linkedMetricIds && l.linkedMetricIds.length > 0) {
      const linkedMetrics = l.linkedMetricIds.map(id => state.metrics.find(m => m.id === id)).filter(Boolean);
      if (linkedMetrics.length > 0) {
        metricsHtml = `
          <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); display:flex; flex-wrap:wrap; gap:12px;">
            ${linkedMetrics.map(m => `
              <div style="font-size:12px; color:var(--accent-color);">
                <span style="opacity:0.6;">${t(m.type === 'weight' ? 'weight' : (m.type === 'bp' ? 'bloodPressure' : m.type))}:</span> ${m.value}
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    return `
      <div class="card" style="display:block; padding: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="card-title">${med.name}</div>
            <div class="card-subtitle">${l.amount_taken} ${med.unit || t('units')} ${t('taken')}</div>
          </div>
          <div style="font-size:12px; color:#94a3b8; text-align:right;">${time}</div>
        </div>
        ${metricsHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="glass-panel" style="padding-top:0;">
      <div class="card-list">
        ${allLogs.length > 0 ? logCards : `<div class="empty-state">${t('noLogsToday')}</div>`}
      </div>
    </div>
  `;
}

window._setHistoryView = (view) => {
  state.historyView = view;
  render();
};


// 5. Settings / Export
function renderSettings() {
  return `
    <div class="glass-panel">
      <div class="text-h2">${t('dataManagement')}</div>
      <p class="text-body" style="margin-bottom: 20px;">${t('dataNote')}</p>
      
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
        <button class="btn" onclick="window.exportData()">${t('exportData')}</button>
        <button class="btn btn-secondary" onclick="window.confirmClearLogs()" style="border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.05);">${t('deleteLogs')}</button>
        <button class="btn btn-secondary" onclick="window.resetToday()" style="border-color: var(--accent-color); color: var(--accent-color); background: rgba(99, 102, 241, 0.05);">${t('resetTodayLbl')}</button>
        <button class="btn btn-danger" onclick="window.confirmClearAll()" style="margin-top: 8px;">${t('deleteAllData')}</button>
      </div>
      
      <div class="text-h2">AI Configuration</div>
      <div class="form-group">
        <label>${t('enteringApiKey')}</label>
        <input type="password" id="grok-api-key-input" value="${state.grokKey}" placeholder="xai-...">
      </div>
      <div class="form-group" style="position:relative;">
        <label>${t('modelIdLabel')}</label>
        <div style="display:flex; gap:8px;">
          ${state.availableModels.length > 0 
            ? `<select id="grok-model-input" style="flex:1;">
                ${state.availableModels.map(m => `<option value="${m}" ${state.grokModel === m ? 'selected' : ''}>${m}</option>`).join('')}
                <option value="custom">${t('customModel')}</option>
               </select>`
            : `<input type="text" id="grok-model-input" value="${state.grokModel}" placeholder="grok-4.20-non-reasoning" style="flex:1;">`
          }
          <button class="btn btn-secondary" style="width:auto; padding:0 12px; font-size:12px;" onclick="window.fetchGrokModels()" title="${t('refreshModels')}">🔄</button>
        </div>
        <div style="font-size:10px; color:#94a3b8; margin-top:4px;">${t('modelSuggestion')}</div>
      </div>
      <button class="btn" onclick="window.saveSettings()">${t('saveSettingsBtn')}</button>
      <div id="settings-msg" style="margin-top: 12px; color: var(--accent-color);"></div>

      <div style="border-top: 1px solid var(--glass-border); margin: 32px 0;"></div>
      
      <div class="text-h2">${t('restoreData')}</div>
      <input type="file" id="import-file" accept=".json" style="margin-bottom: 12px;">
      <button class="btn btn-secondary" onclick="window.importData()">${t('importRestore')}</button>
    </div>
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

  // Show adverse events if they exist
  const adverseEl = document.getElementById('med-fda-adverse');
  if (med.adverse_events) {
    state.pendingAdverseEvents = med.adverse_events;
    adverseEl.style.display = 'block';
    adverseEl.innerHTML = window._renderAdverseBox(med.adverse_events, med.name);
  } else {
    adverseEl.style.display = 'none';
  }

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



window._renderAdverseBox = (text, brand, viaIngredient = false) => {
  const label = viaIngredient ? t('adverseVia').replace('{ing}', '...') : t('adverseLabel');
  return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
      <div style="flex:1;"><strong>${label}</strong><br>${text}</div>
      <div style="display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
        <button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:10px;" onclick="window.showAdverseOverlay(null, state.pendingAdverseEvents, '${brand.replace(/'/g, "\\'")}')">${t('detailsBtn')}</button>
        <button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:10px; background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:#a5b4fc;" onclick="window.open('https://www.startpage.com/sp/search?query=${encodeURIComponent(brand + ' medication')}', '_blank')">${t('searchStartpage').split(' ').pop()}</button>
      </div>
    </div>
  `;
};

window.showAdverseOverlay = (id, rawText, name) => {
  let m = null;
  let adverseEvents = rawText;
  let displayName = name || t('unknown');

  if (id) {
    m = state.medications.find(med => med.id === id);
    if (m) {
      adverseEvents = m.adverse_events;
      displayName = m.name;
    }
  }

  if (!adverseEvents) return;

  const app = document.getElementById('app');
  let overlay = document.getElementById('adverse-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'adverse-overlay';
    overlay.className = 'glass-panel';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 2000; display: flex; flex-direction: column;
      padding: 24px; padding-top: max(24px, env(safe-area-inset-top));
      overflow-y: auto; background: rgba(15, 17, 21, 0.95);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: none; border-radius: 0;
    `;
    app.appendChild(overlay);
  }

  const parsedContent = window._parseAdverseEvents(adverseEvents);

  overlay.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div class="text-h2" style="margin:0; color:var(--accent-color);">${t('sideEffectsTitle')}</div>
      <button onclick="window.closeAdverseOverlay()" class="btn btn-secondary" style="width:auto; padding:8px 16px; font-size:14px;">${t('close')}</button>
    </div>
    <div style="flex:1;">
      ${parsedContent}
    </div>
    <div style="display:flex; gap:12px; margin-top:24px;">
      <button onclick="window.open('https://www.startpage.com/sp/search?query=${encodeURIComponent(displayName + ' medication')}', '_blank')" class="btn btn-secondary" style="gap:8px;">
        ${t('searchStartpage')}
      </button>
      <button onclick="window.closeAdverseOverlay()" class="btn" style="flex:1;">${t('close')}</button>
    </div>
  `;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeAdverseOverlay = () => {
  const overlay = document.getElementById('adverse-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
};

window._parseAdverseEvents = (text) => {
  // 1. Frequency Parsing (Symptom (XX%))
  const freqRegex = /([^,.;:]+?)\s*\(?\s*(\d+(?:\.\d+)?\s*%|>\s*\d+\s*%)\s*\)?/g;
  const matches = [...text.matchAll(freqRegex)];
  
  if (matches.length > 2) {
    const tableRows = matches.map(match => `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.06); color:#cbd5e1; font-size:18px;">${match[1].trim()}</td>
        <td style="padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.06); color:var(--accent-color); text-align:right; font-weight:700; font-size:18px;">${match[2].trim()}</td>
      </tr>
    `).join('');
    return `
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; color:#94a3b8; font-size:12px; text-transform:uppercase; padding-bottom:10px;">${t('symptom')}</th>
            <th style="text-align:right; color:#94a3b8; font-size:12px; text-transform:uppercase; padding-bottom:10px;">${t('frequency')}</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>`;
  }

  // 2. Bullet Parsing
  const bullets = text.split(/[•\n;]|\.\s(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 5);
  if (bullets.length > 1) {
    return `
      <ul style="list-style: none; padding: 0;">
        ${bullets.map(b => `
          <li style="margin-bottom: 16px; display: flex; gap: 12px; font-size: 18px; line-height: 1.5; color: #f3f4f6;">
            <span style="color:var(--accent-color); flex-shrink:0;">•</span>
            <span>${b}</span>
          </li>
        `).join('')}
      </ul>`;
  }

  // 3. Text Fallback
  return `<div style="font-size: 18px; line-height: 1.6; color: #f3f4f6;">${text}</div>`;
};

window._isPlanDueToday = (p) => window._isPlanDueOnDate(p, new Date());

window._isPlanDueOnDate = (p, targetDate) => {
  const d = new Date(targetDate);
  d.setHours(0,0,0,0);
  const start = new Date(p.startDate || d);
  start.setHours(0,0,0,0);
  
  if (d < start) return false;

  const diffDays = Math.round((d - start) / (1000 * 60 * 60 * 24));

  switch(p.frequency) {
    case 'weekly': 
      const targetWeekday = p.startWeekday !== undefined ? parseInt(p.startWeekday) : start.getDay();
      return d.getDay() === targetWeekday;
    case 'monthly': 
      const targetDay = p.startDayOfMonth !== undefined ? parseInt(p.startDayOfMonth) : start.getDate();
      return d.getDate() === targetDay;
    case 'quarterly': 
      const targetQDay = p.startDayOfMonth !== undefined ? parseInt(p.startDayOfMonth) : start.getDate();
      return d.getDate() === targetQDay && 
             (d.getMonth() - start.getMonth() + (12 * (d.getFullYear() - start.getFullYear()))) % 3 === 0;
    case 'everyXDays': 
      const x = parseInt(p.intervalX) || 1;
      return diffDays % x === 0;
    case 'daily':
    default: return true;
  }
};

window._handleFreqChange = (freq) => {
  document.getElementById('plan-x-days-row').style.display = (freq === 'everyXDays' ? 'block' : 'none');
  document.getElementById('plan-weekday-row').style.display = (freq === 'weekly' ? 'block' : 'none');
  document.getElementById('plan-day-month-row').style.display = (freq === 'monthly' || freq === 'quarterly' ? 'block' : 'none');
};

window._syncPlanAnchors = (dateStr) => {
  if (!dateStr) return;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return;
  document.getElementById('plan-weekday').value = d.getDay();
  document.getElementById('plan-day-of-month').value = d.getDate();
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




window.savePlan = async () => {
  const medicationId = document.getElementById('plan-med').value;
  const timeCategory = document.getElementById('plan-category').value;
  const dose = document.getElementById('plan-dose').value;
  const frequency = document.getElementById('plan-freq').value;
  const intervalX = document.getElementById('plan-interval-x').value;
  const startDate = document.getElementById('plan-start-date').value;
  const startWeekday = document.getElementById('plan-weekday').value;
  const startDayOfMonth = document.getElementById('plan-day-of-month').value;
  
  if (!medicationId || !dose) return alert(t('medAndTime'));
  
  const linkedMetrics = Array.from(document.querySelectorAll('input[name="link-metric"]:checked')).map(cb => cb.value);
  
  const plan = { 
    medicationId, 
    timeCategory, 
    dose, 
    frequency, 
    intervalX, 
    linkedMetrics,
    startDate: new Date(startDate).toISOString(),
    startWeekday,
    startDayOfMonth
  };
  await API.addPlan(plan);
  window.navigate('plans');
};

window.deletePlan = async (id) => {
  if(confirm(t('removeScheduleConfirm'))) {
    await API.deletePlan(id);
    window.navigate('plans');
  }
};

window.searchWithGrok = async () => {
  const query = document.getElementById('med-name').value;
  if (!query || query.length < 2) return alert(t('nameAndDose'));

  if (!state.grokKey) {
    alert(t('missingKeyError'));
    window.navigate('settings');
    return;
  }

  const adverseEl = document.getElementById('med-fda-adverse');
  adverseEl.style.display = 'block';
  adverseEl.innerHTML = `<div style="color: var(--accent-color);">${t('aiThinking')}</div>`;

  try {
    const promptText = `Identifiziere die wichtigsten Medikamente mit dem Namen oder einem ähnlichen Brand wie "${query}". 
    Nenne die Namen in einer Liste und füge auch Generika an. Sortiere die Liste so, dass die Treffer, die am nächsten mit "${query}" übereinstimmen (inkl. korrigierter Typos), ganz oben stehen.
    Return as JSON array of objects in a "results" field.
    Each object must have:
    - name: string (Specific name, typo-corrected. E.g. search "Cymbalta" -> name "Cymbalta", search "Candesartan" -> name "Candesartan")
    - generic_name: string (Active pharmaceutical ingredient)
    - default_dose: string (Common starting dose number)
    - unit: string (mg, ml, pills, or units)
    - format: string (Pill, Liquid, Injection, or Inhaler)
    - adverse_events: string (Main side effects, bullet points)
    
    Structure: {"results": [{"name": "...", "generic_name": "...", ...}]}
    CRITICAL: Always include the most accurate corrected version of "${query}" as the first result.
    Language: ${state.lang === 'de' ? 'German' : 'English'}.
    CRITICAL: If the input is not a real medication, return {"error": "NOT_FOUND"}.
    ONLY valid JSON.`;

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.grokKey}`
      },
      body: JSON.stringify({
        model: state.grokModel,
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = (typeof errData.error === 'string') 
        ? errData.error 
        : (errData.error?.message || res.statusText);
      throw new Error(errorMsg);
    }
    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);

    if (result.error === "NOT_FOUND") {
      adverseEl.innerHTML = `<div style="color: #64748b; font-style: italic;">⚠️ ${t('notFoundAiLabel')}</div>`;
      return;
    }

    // Defensive check: wrap single result in array if Grok fails to follow structure
    let resultsList = [];
    if (Array.isArray(result.results)) {
       resultsList = result.results;
    } else if (result.name) {
       resultsList = [result];
    }
    
    state.pendingGrokResults = resultsList;
    
    if (state.pendingGrokResults.length === 0) {
       adverseEl.innerHTML = `<div style="color: #64748b; font-style: italic;">⚠️ ${t('notFoundAiLabel')}</div>`;
       return;
    }

    if (state.pendingGrokResults.length === 1) {
       window.applyGrokMatch(0);
       return;
    }

    // Multiple results found
    let html = `<div style="margin-bottom:10px;"><strong>${t('multipleFound')}</strong></div>
                <div style="display:flex; flex-direction:column; gap:6px;">`;
    state.pendingGrokResults.forEach((m, idx) => {
      html += `<button class="btn btn-secondary" style="text-align:left; padding:8px; font-size:12px;" onclick="window.applyGrokMatch(${idx})">
                ${m.name} <span style="opacity:0.6; font-size:10px;">(${m.generic_name})</span>
               </button>`;
    });
    html += `</div>`;
    adverseEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    adverseEl.innerHTML = `<div style="color: #ef4444;">${t('aiError')}<br><span style="font-size:10px; opacity:0.8;">${err.message}</span></div>`;
  }
};

window.applyGrokMatch = (idx) => {
  const match = state.pendingGrokResults[idx];
  if (!match) return;

  const nameEl = document.getElementById('med-name');
  const doseEl = document.getElementById('med-dose');
  const unitEl = document.getElementById('med-unit');
  const formatEl = document.getElementById('med-format');
  const adverseEl = document.getElementById('med-fda-adverse');

  nameEl.value = match.name;
  doseEl.value = match.default_dose || "";
  if (match.unit) unitEl.value = match.unit;
  if (match.format) formatEl.value = match.format;

  if (match.adverse_events) {
    state.pendingAdverseEvents = match.adverse_events;
    adverseEl.innerHTML = window._renderAdverseBox(match.adverse_events, match.name);
    adverseEl.style.display = 'block';
  } else {
    adverseEl.style.display = 'none';
  }
};

window._renderAdverseBox = (text, brand, viaIngredient = false) => {
  const label = viaIngredient ? t('adverseVia').replace('{ing}', '...') : t('adverseLabel');
  return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
      <div style="flex:1;"><strong>${label}</strong><br>${text}</div>
      <div style="display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
        <button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:10px;" onclick="window.showAdverseOverlay(null, state.pendingAdverseEvents, '${brand.replace(/'/g, "\\'")}')">${t('detailsBtn')}</button>
        <button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:10px; background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:#a5b4fc;" onclick="window.open('https://www.startpage.com/sp/search?query=${encodeURIComponent(brand + ' medication')}', '_blank')">${t('searchStartpage').split(' ').pop()}</button>
      </div>
    </div>
  `;
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


// --- Helper Functions (Legacy Search Removed) ---





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

window.saveSettings = async () => {
  const key = document.getElementById('grok-api-key-input').value;
  const model = document.getElementById('grok-model-input').value;
  if (!key || !model) return alert(t('enteringApiKey'));
  
  const msgEl = document.getElementById('settings-msg');
  msgEl.innerHTML = `<span style="color: var(--accent-color);">${t('testingKey')}</span>`;
  
  try {
    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = (typeof errData.error === 'string') 
        ? errData.error 
        : (errData.error?.message || res.statusText);
      throw new Error(errorMsg);
    }
    
    state.grokKey = key;
    state.grokModel = model;
    localStorage.setItem('grok_api_key', key);
    localStorage.setItem('grok_model', model);
    
    // Auto-fetch models on success
    await window.fetchGrokModels(false);
    
    msgEl.innerHTML = `<span style="color: #10b981;">✓ ${t('keyValid')}</span>`;
    setTimeout(() => msgEl.innerText = '', 3000);
  } catch (err) {
    msgEl.innerHTML = `<span style="color: #ef4444;">❌ ${t('keyInvalid')}<br><small style="font-size:10px;">${err.message}</small></span>`;
  }
};

window.fetchGrokModels = async (manual = true) => {
  if (!state.grokKey) return manual ? alert(t('missingKeyError')) : null;
  
  if (manual) {
    const msgEl = document.getElementById('settings-msg');
    if (msgEl) msgEl.innerText = t('fetchingModels');
  }

  try {
    const res = await fetch("https://api.x.ai/v1/models", {
      headers: { "Authorization": `Bearer ${state.grokKey}` }
    });
    const data = await res.json();
    if (data.data) {
      state.availableModels = data.data.map(m => m.id).sort();
      localStorage.setItem('grok_available_models', JSON.stringify(state.availableModels));
      if (manual) render();
    }
  } catch (e) {
    console.error("Failed to fetch models", e);
    if (manual) alert(t('aiError'));
  }
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
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await API.importData(e.target.result);
      alert(t('restoredSuccess'));
      window.navigate('dashboard');
    } catch(err) { alert(t('importError')); }
  };
  reader.readAsText(file);
};

window.confirmClearAll = async () => {
  if (confirm(t('confirmDeleteAll'))) {
    await API.clearAllData();
    window.navigate('dashboard');
  }
};

window.confirmClearLogs = async () => {
  if (confirm(t('confirmDeleteLogs'))) {
    await API.clearLogs();
    window.navigate('dashboard');
  }
};

window.resetToday = async () => {
  await API.clearTodayLogs();
  window.navigate('dashboard');
};

function renderAnalytics() {
    const r = state.analyticsRange || 7;
    return `
      <div class="glass-panel" style="padding-top:0;">
        <div style="display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:8px;">
          <button class="btn btn-secondary" style="font-size:11px; padding:6px 12px; min-width:max-content; ${r===7?'background:var(--accent-color);color:#000;':''}" onclick="window._setAnalyticsRange(7)">${t('last7Days')}</button>
          <button class="btn btn-secondary" style="font-size:11px; padding:6px 12px; min-width:max-content; ${r===30?'background:var(--accent-color);color:#000;':''}" onclick="window._setAnalyticsRange(30)">${t('last30Days')}</button>
          <button class="btn btn-secondary" style="font-size:11px; padding:6px 12px; min-width:max-content; ${r===365?'background:var(--accent-color);color:#000;':''}" onclick="window._setAnalyticsRange(365)">${t('lastYear')}</button>
        </div>
        
        <div class="text-h2" style="margin-top:20px;">${t('adherence')}</div>
        <div id="chart-adherence" style="min-height: 200px; background: rgba(0,0,0,0.2); border-radius:12px; padding:12px;"></div>

        <div class="text-h2" style="margin-top:32px;">${t('trends')}</div>
        <div id="chart-weight" style="min-height: 200px; background: rgba(0,0,0,0.2); border-radius:12px; padding:12px; margin-bottom:16px;"></div>
        <div id="chart-bp" style="min-height: 200px; background: rgba(0,0,0,0.2); border-radius:12px; padding:12px; margin-bottom:16px;"></div>
        <div id="chart-others" style="min-height: 200px; background: rgba(0,0,0,0.2); border-radius:12px; padding:12px; margin-bottom:16px;"></div>
      </div>
    `;
}

window._setAnalyticsRange = (r) => {
    state.analyticsRange = r;
    render();
};

async function _initCharts() {
    if (typeof ApexCharts === 'undefined') return setTimeout(_initCharts, 200);
    
    const range = state.analyticsRange || 7;
    const dates = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        dates.push(d);
    }

    // 1. Adherence Calculation
    const adherenceData = dates.map(date => {
        const due = state.plans.filter(p => window._isPlanDueOnDate(p, date)).length;
        if (due === 0) return 0;
        const taken = state.logs.filter(l => {
            const ld = new Date(l.timestamp);
            return ld.getDate() === date.getDate() && ld.getMonth() === date.getMonth() && ld.getFullYear() === date.getFullYear();
        }).length;
        return Math.min(100, Math.round((taken / due) * 100));
    });

    const categories = dates.map(d => d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }));

    new ApexCharts(document.querySelector("#chart-adherence"), {
        series: [{ name: t('adherence'), data: adherenceData }],
        chart: { type: 'bar', height: 200, toolbar: { show: false }, background: 'transparent' },
        theme: { mode: 'dark' },
        colors: ['#6366f1'],
        plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
        xaxis: { categories },
        yaxis: { max: 100, labels: { formatter: v => v + '%' } },
        tooltip: { y: { formatter: v => v + '%' } }
    }).render();

    // 2. Metrics (Weight)
    const weightData = state.metrics.filter(m => m.type === 'weight').map(m => ({ x: m.timestamp, y: parseFloat(m.value) }));
    new ApexCharts(document.querySelector("#chart-weight"), {
        series: [{ name: t('weight'), data: weightData }],
        chart: { type: 'line', height: 200, toolbar: { show: false }, background: 'transparent' },
        stroke: { curve: 'smooth' },
        theme: { mode: 'dark' },
        colors: ['#10b981'],
        xaxis: { type: 'datetime' },
        yaxis: { decimalsInFloat: 1 }
    }).render();

    // 3. Blood Pressure
    const bpData = state.metrics.filter(m => m.type === 'bp').map(m => {
        const parts = m.value.split('/');
        return { t: m.timestamp, sys: parseInt(parts[0]), dia: parseInt(parts[1]) };
    });
    new ApexCharts(document.querySelector("#chart-bp"), {
        series: [
            { name: 'Sys', data: bpData.map(d => ({ x: d.t, y: d.sys })) },
            { name: 'Dia', data: bpData.map(d => ({ x: d.t, y: d.dia })) }
        ],
        chart: { type: 'line', height: 200, toolbar: { show: false }, background: 'transparent' },
        theme: { mode: 'dark' },
        colors: ['#f43f5e', '#fb923c'],
        xaxis: { type: 'datetime' }
    }).render();

    // 4. Pulse & Glucose
    const pulseData = state.metrics.filter(m => m.type === 'pulse').map(m => ({ x: m.timestamp, y: parseFloat(m.value) }));
    const glucoseData = state.metrics.filter(m => m.type === 'glucose').map(m => ({ x: m.timestamp, y: parseFloat(m.value) }));
    new ApexCharts(document.querySelector("#chart-others"), {
        series: [
            { name: t('pulse'), data: pulseData },
            { name: t('glucose'), data: glucoseData }
        ],
        chart: { type: 'line', height: 200, toolbar: { show: false }, background: 'transparent' },
        theme: { mode: 'dark' },
        colors: ['#ec4899', '#8b5cf6'],
        xaxis: { type: 'datetime' }
    }).render();
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error("SW Registration failed", err));
  }
  window.navigate('dashboard');
});
