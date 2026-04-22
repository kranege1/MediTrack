import './style.css';
import { API } from './db.js';

// Polyfill: crypto.randomUUID() needs secure context + Safari 15.4+
function _uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch(e) { /* fall through */ }
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

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
  defaultRegion: localStorage.getItem('default_region') || '',
  pendingGrokResults: [],
  historyView: 'list',
  analyticsRange: 7,
  showAddPlanPanel: false,
  useLiveSearch: localStorage.getItem('use_live_search') === 'true',
  showMagicImport: false,
  historyMedFilters: [],
  localDrugs: []
};
const APP_VERSION = '4.82.7';
const state = window.state;

const GROK_BASE_URL = "https://api.x.ai/v1/chat/completions";

// === i18n ===
const i18n = {
  en: {
    settings:'Settings', home:'Home', meds:'Medications', logAction:'Log Intake', plans:'Plans',
    dueToday:'Due Today', noPlans:'No plans found. Create one!',
    loggedActivity:'Today\'s Activity', noLogsToday:'No intake logged today.',
    recentMetrics:'Recent Metrics', noMetrics:'No metrics recorded yet.', 
    scheduled:'Scheduled', completed:'\u2705 Completed', skipped:'\u274C Skipped', skip:'Skip', dueTodayBadge:'\u2022 Due Today', taken:'taken', weight:'Weight',
    pastDue:'PAST DUE', missedTitle:'Missed Appointments',
    addMedication:'Add Medication', nameLbl:'Name', defaultDose:'Default Dose', unitLbl:'Unit', formatLbl:'Format',
    saveMedication:'Save Medication', cancel:'Cancel', yourMedications:'Your Medications',
    noMedsFound:'No medications found. Add one!', delete:'Delete', addBtn:'+ Add New',
    viewSideEffects:'\u26A0\uFE0F View Side Effects', translateAdverse:'\uD83C\uDF10 Translate to German',
    createSchedule:'Create Plan', selectMed:'Select Medication', timeOfDay:'Time',
    dose:'Dose', savePlan:'Save Plan', yourSchedule:'Your Daily Schedule',
    noSchedule:'No schedule created.', remove:'Remove', newPlan:'+ New',
    takes:'Takes', at:'at', appleCalendar:'+ Apple Calendar', chooseOption:'-- Choose Option --',
    addMedFirst:'Add a medication first.',
    logIntake:'Log Intake', addMedFirst2:'Please add a medication first.',
    amountTaken:'Amount Taken', quantity:'Quantity', recordIntake:'Save Intake',
    logMetric:'Record Body Metric', metricType:'Metric Type', bodyWeight:'Body Weight (kg)',
    bloodPressure:'Blood Pressure (mmHg)', valueLbl:'Value', saveMetric:'Save Metric',
    dataManagement:'Data Management',
    dataNote:'Your data is entirely private and stored locally. Hard-deleting the app loses all data. Export regularly!',
    exportData:'Export Data (Backup)', restoreData:'Restore Data', importRestore:'Import / Restore',
    nameAndDose:'Name and dose required', selectAndAmount:'Select medication and amount',
    enterIngredient:'Enter ingredient name first.', medAndTime:'Medication and time required',
    queryingFDA:'Querying FDA database...', noBrandTrying:'No brand match \u2014 trying active ingredient...',
    searchingWiki:'Searching Wikipedia for ingredients...',
    genericMatch:'Generic match', viaWiki:'\uD83D\uDCDA Via Wikipedia', doses:'Dosen',
    notFoundFDA:'Not found in FDA, Wikipedia, or generic databases.',
    saveAsTypedBtn:'Save as "{n}"', linkIngredient:'Optional: Ingredient for FDA data',
    ingredientPlaceholder:'e.g. Rosuvastatin', fetchBtn:'Fetch',
    adverseLabel:'\u26A0\uFE0F Main Adverse Events:', adverseVia:'\u26A0\uFE0F Main Adverse Events (via {ing}):',
    notFoundFDAShort:'Not found in FDA either.',
    deleteMedConfirm:'Delete medication?', loggedSuccess:'Logged successfully!',
    removeScheduleConfirm:'Remove schedule?', valueRequired:'Value required',
    selectFile:'Please select a file first.', restoredSuccess:'Data successfully restored!',
    importError:'Error reading backup file.', lookupFailed:'Lookup failed. Check connection.',
    wikiIngredientFound:'Wikipedia found ingredient: {ing}', translating:'Translating...',
    unknown:'Unknown', units:'Units', pillUnit:'Pill(s)', kg:'kg',
    pillFormat:'Pill', liquidFormat:'Liquid', injectionFormat:'Injection', inhalerFormat:'Inhaler',
    detailsBtn:'Details', editBtn:'Edit', updateMedication:'Edit Medication',
    sideEffectsTitle:'\u26A0\uFE0F Side Effects', frequency:'Frequency', symptom:'Symptom', close:'Close',
    morning:'Morning', noon:'Noon', evening:'Evening',
    daily:'Daily', weekly:'Weekly', monthly:'Monthly', quarterly:'Quarterly', everyXDays:'Every X Days',
    dayIntervalLbl:'Repeat every {x} days',
    searchStartpage:'\uD83D\uDD0D Search on Startpage',
    searchAi:'\uD83D\uDD0D AI Search',
    enteringApiKey:'Grok API-Key',
    aiThinking:'Grok thinking...',
    aiError:'AI request failed.',
    settingsSavedLabel:'Settings saved',
    saveSettingsBtn:'Save Settings',
    missingKeyError:'Please setup your Grok API-Key in settings first.',
    testingKey:'Testing Key...',
    keyInvalid:'Key invalid',
    modelIdLabel:'Grok Model ID',
    modelSuggestion:'Try: grok-4.20-non-reasoning or grok-2',
    fetchingModels:'Loading models...',
    refreshModels:'Refresh Models',
    customModel:'Custom...',
    notFoundAiLabel:'Medication not found or unknown.',
    selectMatch:'Select match:',
    multipleFound:'Multiple matches found',
    history:'History',
    pulse:'Pulse',
    glucose:'Blood Glucose',
    linkMetrics:'Link body metrics with this plan',
    pulseLabel:'Pulse (bpm)',
    glucoseLabel:'Glucose (mg/dL)',
    deleteAllData:'Clear all project data',
    deleteLogs:'Clear intake log only',
    resetTodayLbl:'Reset today\'s plan',
    confirmDeleteAll:'CRITICAL: DELETE ALL DATA (Meds, Plans, Logs)? This cannot be undone!',
    confirmDeleteLogs:'Clear all intake/metric history?',
    metricRequired:'Metric required',
    fillRequiredMetrics:'Please enter required metrics.',
    anchorDate:'Start Date',
    startWeekday:'Weekday',
    startDayOfMonth:'Day of Month',
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
    missed:'Missed',
    generateTestBtn:'Add Test Data',
    clearTestBtn:'Clear Test Data',
    testDataCount:'Count: {n}',
    testDataNote:'Test data is marked. Your personal entries stay safe when clearing test data.',
    upcomingEvents:'Upcoming Events',
    doctorNotFoundAi: 'No doctor matching your criteria was found.',
    forceUpdateBtn: '\uD83D\uDCC4 Force App Update (Clear Cache)',
    today:'Today',
    tomorrow:'Tomorrow',
    noUpcoming:'No upcoming medications.',
    weeklyExport:'Weekly Export (.ics)',
    addToCalendar:'Reminder',
    calendarFileName:'Medicine_Plan.ics',
    appointment:'Doctor Appointment',
    medication:'Medication',
    doctorName: 'Name, Practice or Clinic (Search & Auto-Fill)',
    location: 'Location / Address',
    phone: 'Phone Number',
    note: 'Notes',
    oneTime: 'One-time (Date & Time)',
    recurring: 'Recurring',
    doctorSearch: '\u2728 Find Doctor Online',
    regionPlaceholder: 'City or Postal Code',
    specialty: 'Specialty (Urology, GP, ...)',
    anySpecialty: 'Any Specialty',
    doctorSelect: 'Select Doctor',
    defaultRegionLabel:'Default City / Region for AI Search',
    locating:'Locating...',
    locErr:'Location failed',
    specialties: [
      'General Practitioner', 'Internist', 'Cardiologist', 'Dentist', 'Urologist', 
      'Gynecologist', 'Orthopedist', 'Dermatologist', 'Ophthalmologist', 'ENT', 
      'Pediatrician', 'Neurologist', 'Psychiatrist'
    ],
    searchGoogle: 'Search on Google',
    aiAccuracyWarning: '\u26A0\uFE0F AI data can be hallucinated or outdated. Always verify before visiting!',
    liveSearchLabel: 'Enable Live AI Web Search',
    liveSearchSub: 'Requires grok-4.20-reasoning or grok-2. Provides 100% current data.',
    magicImportBtn: 'Magic Import',
    magicImportPlaceholder: 'Paste Google results or Link here...',
    magicImportInfo: 'AI will extract name, address and phone from text or URLs.',
    importing: 'Magic Importing...',
    autoSearchBtn: 'Auto-Search & Fill',
    autoSearchInfo: 'AI will search for the name above and find the address.',
    updateAvailable: 'Update Available',
    currentVersion: 'Current Version',
    newVersion: 'New Version',
    updateNow: 'Update Now',
    upToDate: 'App is up to date'
  },
  de: {
    settings:'Einstellungen',
    home:'Start', meds:'Medikamente', logAction:'Einnahme', plans:'Pl\u00E4ne',
    dueToday:'Heute f\u00FCllig', noPlans:'Keine Pl\u00E4ne vorhanden. Erstelle einen Plan!',
    loggedActivity:'Heutige Aktivit\u00E4t', noLogsToday:'Noch keine Einnahme heute.',
    recentMetrics:'Letzte Messwerte', noMetrics:'Noch keine Messwerte eingetragen.',
    scheduled:'Geplant', completed:'\u2705 Eingenommen', skipped:'\u274C \u00DCbersprungen', skip:'\u00DCberspringen', dueTodayBadge:'\u2022 Heute f\u00FCllig', taken:'eingenommen', weight:'Gewicht',
    pastDue:'\u00DCberf\u00E4llig', missedTitle:'Verpasste Termine',
    addMedication:'Medikament hinzuf\u00FCgen', nameLbl:'Name', defaultDose:'Standarddosis', unitLbl:'Einheit', formatLbl:'Format',
    saveMedication:'Medikament speichern', cancel:'Abbrechen', yourMedications:'Ihre Medikamente',
    noMedsFound:'Keine Medikamente gefunden. F\u00FCgen Sie eines hinzu!', delete:'L\u00F6schen', addBtn:'+ Hinzuf\u00FCgen',
    viewSideEffects:'\u26A0\uFE0F Nebenwirkungen', translateAdverse:'\uD83C\uDF10 Auf Deutsch \u00FCbersetzen',
    createSchedule:'Plan erstellen', selectMed:'Medikament w\u00E4hlen', timeOfDay:'Uhrzeit',
    dose:'Dosis', savePlan:'Plan speichern', yourSchedule:'Ihr Tagesplan',
    noSchedule:'Kein Tagesplan erstellt.', remove:'Entfernen', newPlan:'+ Neu',
    takes:'Nimmt', at:'um', appleCalendar:'+ Apple Kalender', chooseOption:'-- Bitte w\u00E4hlen --',
    addMedFirst:'Zuerst ein Medikament hinzuf\u00FCgen.',
    logIntake:'Einnahme erfassen', addMedFirst2:'Bitte zuerst ein Medikament hinzuf\u00FCgen.',
    amountTaken:'Eingenommene Menge', quantity:'Menge', recordIntake:'Einnahme speichern',
    logMetric:'K\u00F6rpermesswert erfassen', metricType:'Messtyp', bodyWeight:'K\u00F6rpergewicht (kg)',
    bloodPressure:'Blutdruck (mmHg)', valueLbl:'Wert', saveMetric:'Messwert speichern',
    dataManagement:'Datenverwaltung',
    dataNote:'Ihre Daten sind vollst\u00E4ndig privat und lokal gespeichert. Beim L\u00F6schen der App gehen alle Daten verloren. Exportieren Sie Ihre Daten regelm\u00E4\u00DFig!',
    exportData:'Daten exportieren (Sicherung)', restoreData:'Daten wiederherstellen', importRestore:'Importieren / Wiederherstellen',
    nameAndDose:'Name und Dosis erforderlich', selectAndAmount:'Bitte Medikament und Menge angeben',
    enterIngredient:'Bitte zuerst einen Wirkstoffnamen eingeben.', medAndTime:'Medication and time required',
    queryingFDA:'FDA-Datenbank wird abgefragt...', noBrandTrying:'Kein Markenname \u2014 suche nach Wirkstoff...',
    searchingWiki:'Wikipedia wird nach Wirkstoffen durchsucht...',
    genericMatch:'Wirkstoff-Treffer', viaWiki:'\uD83D\uDCDA Via Wikipedia', doses:'Dosen',
    notFoundFDA:'Nicht in FDA, Wikipedia oder Wirkstoffdatenbank gefunden.',
    saveAsTypedBtn:'\u201E{n}\u201C so speichern', linkIngredient:'Optional: Wirkstoff eingeben f\u00FCr FDA-Daten',
    ingredientPlaceholder:'z.B. Rosuvastatin', fetchBtn:'Abrufen',
    adverseLabel:'\u26A0\uFE0F Hauptnebenwirkungen:', adverseVia:'\u26A0\uFE0F Hauptnebenwirkungen (via {ing}):',
    notFoundFDAShort:'Auch in FDA nicht gefunden.',
    deleteMedConfirm:'Medikament l\u00F6schen?', loggedSuccess:'Erfolgreich eingetragen!',
    removeScheduleConfirm:'Tagesplan entfernen?', valueRequired:'Wert erforderlich',
    selectFile:'Bitte zuerst eine Datei w\u00E4hlen.', restoredSuccess:'Daten erfolgreich wiederhergestellt!',
    importError:'Fehler beim Lesen der Sicherungsdatei.', lookupFailed:'Suche fehlgeschlagen. Verbindung pr\u00FCfen.',
    wikiIngredientFound:'Wikipedia hat Wirkstoff gefunden: {ing}', translating:'\u00DCbersetze...',
    unknown:'Unbekannt', units:'Einheiten', pillUnit:'Pille(n)', kg:'kg',
    pillFormat:'Pille', liquidFormat:'Fl\u00FCssigkeit', injectionFormat:'Injektion', inhalerFormat:'Inhalator',
    detailsBtn:'Details', editBtn:'Bearbeiten', updateMedication:'Medikament bearbeiten',
    sideEffectsTitle:'\u26A0\uFE0F Nebenwirkungen', frequency:'H\u00E4ufigkeit', symptom:'Symptom', close:'Schlie\u00DFen',
    morning:'Morgens', noon:'Mittags', evening:'Abends',
    daily:'T\u00E4glich', weekly:'W\u00F6chentlich', monthly:'Monatlich', quarterly:'Viertelj\u00E4hrlich', everyXDays:'Alle X Tage',
    dayIntervalLbl:'Wiederhole alle {x} Tage',
    searchStartpage:'\uD83D\uDD0D Auf Startpage suchen',
    searchAi:'\uD83D\uDD0D KI-Suche',
    enteringApiKey:'Grok API-Key',
    aiThinking:'Grok denkt nach...',
    aiError:'Fehler bei der KI-Abfrage.',
    settingsSavedLabel:'Einstellungen gespeichert',
    saveSettingsBtn:'Einstellungen speichern',
    missingKeyError:'Bitte hinterlege zuerst deinen Grok API-Key in den Einstellungen.',
    testingKey:'Key wird gepr\u00FCft...',
    keyInvalid:'Key ung\u00FCltig',
    modelIdLabel:'Grok Modell ID',
    modelSuggestion:'Versuche: grok-4.20-non-reasoning oder grok-2',
    fetchingModels:'Modelle werden geladen...',
    refreshModels:'Modelle aktualisieren',
    customModel:'Benutzerdefiniert...',
    notFoundAiLabel:'Medikament nicht gefunden oder unbekannt.',
    selectMatch:'Bitte Treffer w\u00E4hlen:',
    multipleFound:'Mehrere Ergebnisse gefunden',
    history:'Historie',
    pulse:'Puls',
    glucose:'Blutzucker',
    linkMetrics:'K\u00F6rpermesswerte mit diesem Plan verkn\u00FCpfen',
    pulseLabel:'Puls (bpm)',
    glucoseLabel:'Blutzucker (mg/dL)',
    deleteAllData:'Alle Projektdaten l\u00F6schen',
    deleteLogs:'Nur Einnahme-Log l\u00F6schen',
    resetTodayLbl:'Heutigen Tagesplan zur\u00FCcksetzen',
    confirmDeleteAll:'KRITISCH: ALLE Daten l\u00F6schen (Medikamente, Pl\u00E4ne, Logs)? Dies kann nicht r\u00FCckg\u00E4ngig gemacht werden!',
    confirmDeleteLogs:'Alle Einnahme- und Messwert-Historien l\u00F6schen?',
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
    adherence:'Adh\u00E4renz',
    trends:'Trends',
    last7Days:'Letzte 7 Tage',
    last30Days:'Letzte 30 Tage',
    lastYear:'Letztes Jahr',
    missed:'Vergessen',
    generateTestBtn:'Testdaten hinzuf\u00FCgen',
    clearTestBtn:'Testdaten l\u00F6schen',
    testDataCount:'Anzahl: {n}',
    testDataNote:'Testdaten sind markiert. Deine pers\u00F6nlichen Eintr\u00E4ge bleiben beim L\u00F6schen sicher.',
    upcomingEvents:'Anstehende Termine',
    doctorNotFoundAi: 'Kein Arzt passend zu Ihren Kriterien gefunden.',
    forceUpdateBtn: '\uD83D\uDCC4 App-Update erzwingen (Cache leeren)',
    today:'Heute',
    tomorrow:'Morgen',
    noUpcoming:'Keine anstehenden Medikamente.',
    weeklyExport:'Wochen-Export (.ics)',
    addToCalendar:'Erinnerung',
    calendarFileName:'Medikamente_Plan.ics',
    appointment:'Arzt-Termin',
    medication:'Medikament',
    doctorName:'Arzt, Klinik oder Praxis (Suche & Auto-Fill)',
    location:'Ort / Adresse',
    phone:'Telefonnummer',
    note:'Notizen',
    oneTime:'Einmalig (Datum & Uhrzeit)',
    recurring:'Regelm\u00E4\u00DFig',
    doctorSearch:'\u2728 Arzt im Internet suchen',
    regionPlaceholder:'Ort oder Postleitzahl',
    specialty:'Fachrichtung (Urologe, Hausarzt, ...)',
    anySpecialty:'Keine Einschr\u00E4nkung (Alle)',
    doctorSelect:'Arzt w\u00E4hlen',
    magicImportFallback: 'Manuell einf\u00FCgen (Text/Link)',
    defaultRegionLabel:'Standard Stadt / Region f\u00FCr KI-Suche',
    locating:'Ortung...',
    locErr:'Ortung fehlgeschlagen',
    specialties: [
      'Allgemeinmediziner', 'Internist', 'Kardiologe', 'Zahnarzt', 'Urologe', 
      'Gyn\u00E4kologe', 'Orthop\u00E4de', 'Hautarzt', 'Augenarzt', 'HNO-Arzt', 
      'Kinderarzt', 'Neurologe', 'Psychiater'
    ],
    searchGoogle: 'Auf Google suchen',
    aiAccuracyWarning: '\u26A0\uFE0F KI-Daten k\u00F6nnen erfunden oder veraltet sein. Bitte vor dem Besuch immer pr\u00FCfen!',
    liveSearchLabel: 'Live KI-Websuche aktivieren',
    liveSearchSub: 'Erfordert grok-4.20-reasoning oder grok-2. Sorgt f\u00FCr 100% aktuelle Daten.',
    magicImportBtn: 'Magic Import',
    magicImportPlaceholder: 'Google-Ergebnis oder Link hier einf\u00FCgen...',
    magicImportInfo: 'KI extrahiert Name, Adresse und Telefon aus Text oder Links.',
    importing: 'Magic Import läuft...',
    autoSearchBtn: 'Automatisch suchen & ausf\u00FCllen',
    autoSearchInfo: 'KI sucht nach dem oben eingegebenen Namen im Internet.',
    updateAvailable: 'Update verfügbar',
    currentVersion: 'Aktuelle Version',
    newVersion: 'Neue Version',
    updateNow: 'Jetzt aktualisieren',
    upToDate: 'App ist auf dem neuesten Stand'
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

window._forceReload = async () => {
  if (confirm(t('confirmDeleteAll').split(':')[0] + '? (Page will reload)')) {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let r of regs) await r.unregister();
    }
    const keys = await caches.keys();
    for (let k of keys) await caches.delete(k);
    window.location.reload(true);
  }
};

window.navigate = async (view) => {
  state.currentView = view;
  state.showAddPlanPanel = false;
  state.showMagicImport = false;
  await loadData();
  render();
};

window._geolocate = (inputId) => {
  const el = document.getElementById(inputId);
  if (!navigator.geolocation) return alert(t('locErr'));
  
  const originalVal = el.value;
  el.value = t('locating');
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`, {
        headers: { 'Accept-Language': state.lang }
      });
      const data = await res.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const postcode = data.address.postcode || '';
      const country = data.address.country || '';
      
      if (city) {
        let locParts = [city];
        if (postcode) locParts.push(postcode);
        if (country) locParts.push(country);
        const finalLoc = locParts.join(', ');
        
        el.value = finalLoc;
        // If this is the settings input, auto-save state
        if (inputId === 'grok-region-input') {
          state.defaultRegion = finalLoc;
          localStorage.setItem('default_region', finalLoc);
        }
      } else {
        el.value = originalVal;
        alert(t('locErr'));
      }
    } catch (err) {
      el.value = originalVal;
      alert(t('locErr') + ': ' + err.message);
    }
  }, (err) => {
    el.value = originalVal;
    alert(t('locErr') + ': ' + err.message);
  });
};

function render() {
  const appDiv = document.getElementById('app');
  if (!appDiv) return;
  appDiv.innerHTML = `
    <div class="header">
      <div>
        <div class="text-h1">MedicaTrack <span style="font-size: 14px; color: var(--accent-color); vertical-align: top;">v4.82.7</span></div>
        <div class="text-body">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <div style="display:flex; border:1px solid rgba(255,255,255,0.15); border-radius:8px; overflow:hidden; font-size:14px; font-weight:700;">
          <button onclick="window.toggleLang('en')" style="padding:8px 12px; background:${state.lang==='en'?'var(--accent-color)':'transparent'}; color:${state.lang==='en'?'#000':'#94a3b8'}; border:none; cursor:pointer;">EN</button>
          <button onclick="window.toggleLang('de')" style="padding:8px 12px; background:${state.lang==='de'?'var(--accent-color)':'transparent'}; color:${state.lang==='de'?'#000':'#94a3b8'}; border:none; cursor:pointer;">DE</button>
        </div>
        <button class="header-action" onclick="window.navigate('settings')" title="${t('settings')}" style="padding: 8px; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div id="view-container" class="page">
      ${getViewHTML()}
      ${_renderInstallPrompt()}
    </div>
  `;

  // Update persistent nav state
  _updateNavUI();

  if (state.currentView === 'history' && state.historyView === 'charts') {
    _initCharts();
  }
}
window.render = render;

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

function _findPastDueItems() {
  const missed = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Look back 7 days for missed items
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dISO = d.toISOString().split('T')[0];
    
    const duePlans = state.plans.filter(p => window._isPlanDueOnDate(p, d));
    for (const p of duePlans) {
      const handled = state.logs.some(l => 
        (l.planId === p.id && l.plannedDate === dISO) || 
        (!l.planId && l.medicationId === p.medicationId && new Date(l.timestamp).setHours(0,0,0,0) === d.getTime())
      );
      if (!handled) {
        missed.push({ plan: p, date: d, dateISO: dISO });
      }
    }
  }
  
  // Group shared missed events
  const grouped = {};
  for (const m of missed) {
    const key = `${m.plan.id}-${m.dateISO}`;
    if (!grouped[key]) {
      grouped[key] = { ...m, count: 1 };
    } else {
      grouped[key].count++;
    }
  }
  
  return Object.values(grouped).sort((a,b) => b.date - a.date);
}

function renderDashboard() {
  const todayStart = new Date().setHours(0,0,0,0);
  const todaysLogs = state.logs.filter(l => new Date(l.timestamp).setHours(0,0,0,0) === todayStart).reverse();
  
  let forecastHtml = '';
  for (let i = 0; i < 14; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    targetDate.setHours(0,0,0,0);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    
    let dateLabel = targetDate.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' });
    if (isToday) dateLabel = t('today');
    else if (isTomorrow) dateLabel = t('tomorrow');

    const duePlans = state.plans.filter(p => window._isPlanDueOnDate(p, targetDate));
    
    if (duePlans.length > 0) {
      const itemsHtml = duePlans.map(p => {
        const isAppt = p.type === 'appointment';
        const med = !isAppt ? (state.medications.find(m => m.id === p.medicationId) || {name: t('unknown')}) : null;
        
        const targetDateISO = targetDate.toISOString().split('T')[0];
        const logEntry = todaysLogs.find(l => l.planId === p.id && l.plannedDate === targetDateISO);
        const isCompleted = !isAppt && logEntry && logEntry.status === 'taken';
        const isSkipped = !isAppt && logEntry && logEntry.status === 'skipped';
        
        if (isSkipped) return '';

        let statusColor = isCompleted ? 'var(--accent-color)' : (isToday ? '#ef4444' : 'rgba(255,255,255,0.2)');
        if (isAppt) statusColor = '#8b5cf6';

        const opacity = isCompleted ? '0.6' : '1';
        
        const title = isAppt ? `\uD83D\uDEBA ${p.doctorName}` : med.name;
        const subtitle = isAppt 
          ? `${p.location ? '\uD83D\uDCCD ' + p.location : ''} ${p.phone ? ' | \uD83D\uDCDE ' + p.phone : ''}`
          : `${t(p.timeCategory || 'morning')} | ${p.dose} ${med.unit || t('units')}`;

        return `
          <div class="card" style="border-left: 3px solid ${statusColor}; opacity: ${opacity}; margin-bottom: 8px; padding: 12px; display:flex; justify-content:space-between; align-items:center;">
            <div style="flex:1; min-width:0;">
              <div class="card-title" style="font-size:14px; margin-bottom:0;">${title}</div>
              <div class="card-subtitle" style="font-size:11px; word-break:break-word;">${subtitle}</div>
              ${isAppt && p.note ? `<div style="font-size:10px; color:#94a3b8; margin-top:4px; font-style:italic;">"${p.note}"</div>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${!isAppt && isToday && !isCompleted ? `
                <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:var(--accent-color); color:var(--accent-color);" onclick="window.confirmIntake('${p.id}', '${targetDateISO}')">\u2713</button>
                <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:#f87171; color:#f87171;" onclick="window.skipIntake('${p.id}', '${targetDateISO}')">\u2715</button>
              ` : (!isAppt && isToday && isCompleted ? `<div style="color:var(--accent-color); font-size:10px; font-weight:700;">${t('completed')}</div>` : '')}
              <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:rgba(255,255,255,0.15);" onclick="window._exportSingleEvent('${p.id}', '${targetDate.toISOString()}')" title="${t('addToCalendar')}">\uD83D\uDDD3\uFE0F</button>
            </div>
          </div>
          ${!isAppt && isToday && !isCompleted && p.linkedMetrics && p.linkedMetrics.length > 0 ? `
             <div id="metrics-entry-${p.id}" style="margin-bottom:12px; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
               <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                 ${p.linkedMetrics.map(type => `
                   <input type="text" id="m-val-${p.id}-${type}" placeholder="${t(type==='weight'?'weight':(type==='bp'?'bloodPressure':type))}" style="padding:6px; font-size:10px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:white;">
                 `).join('')}
               </div>
             </div>
          ` : ''}
        `;
      }).join('');

      forecastHtml += `
        <div style="margin-bottom: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:13px; font-weight:700; color:${isToday?'var(--accent-color)':'#94a3b8'}; text-transform:uppercase; letter-spacing:0.5px;">${dateLabel}</div>
            ${isToday ? `<button class="btn btn-secondary" style="width:auto; padding:4px 8px; font-size:10px; border-color:var(--accent-color); color:var(--accent-color);" onclick="window.navigate('log')">+ ${t('adHoc')}</button>` : ''}
          </div>
          ${itemsHtml}
        </div>
      `;
    }
  }

  const logsHtml = todaysLogs.length ? todaysLogs.map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || {name: t('unknown')};
    return `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; opacity:0.7;">
              <span>${med.name} (${l.amount_taken})</span>
              <span>${new Date(l.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
            </div>`;
  }).join('') : `<div style="font-size:11px; opacity:0.5;">${t('noLogsToday')}</div>`;

  return `
    <div class="glass-panel" style="padding:20px;">
      <div class="text-h2" style="margin-bottom:12px; color:#fff; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${t('upcomingEvents')}
        </div>
        <button class="btn btn-secondary" style="width:auto; padding:6px 12px; font-size:10px; border-color:#6366f1; color:#6366f1; background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05));" onclick="window._exportWeeklyEvents()">
          ${t('weeklyExport')}
        </button>
      </div>
      <div style="max-height: 55vh; overflow-y:auto; padding-right:8px; margin-bottom:24px;">
        ${(() => {
          const missed = _findPastDueItems();
          if (missed.length === 0) return '';
          return `
            <div style="margin-bottom: 24px;">
              <div style="font-size:13px; font-weight:700; color:#f87171; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                ${t('pastDue')}
              </div>
              ${missed.map(m => {
                const p = m.plan;
                const isAppt = p.type === 'appointment';
                const med = !isAppt ? (state.medications.find(med => med.id === p.medicationId) || {name: t('unknown')}) : null;
                const title = isAppt ? `\uD83D\uDEBA ${p.doctorName}` : med.name;
                const subtitle = isAppt 
                  ? `${m.date.toLocaleDateString(undefined, {weekday:'short', day:'2-digit', month:'2-digit'})} | ${p.location || ''}`
                  : `${m.date.toLocaleDateString(undefined, {weekday:'short', day:'2-digit', month:'2-digit'})} \u2022 ${t(p.timeCategory || 'morning')} | ${p.dose} ${med.unit || t('units')}`;
                
                return `
                  <div class="card" style="border-left: 3px solid #f87171; margin-bottom: 8px; padding: 12px; display:flex; justify-content:space-between; align-items:center; background: rgba(248, 113, 113, 0.05);">
                    <div style="flex:1; min-width:0;">
                      <div class="card-title" style="font-size:14px; margin-bottom:0; color:#fca5a5;">${title}</div>
                      <div class="card-subtitle" style="font-size:11px; word-break:break-word;">${subtitle}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                       <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:var(--accent-color); color:var(--accent-color);" onclick="window.confirmIntake('${p.id}', '${m.dateISO}')">\u2713</button>
                       <button class="btn btn-secondary" style="width:auto; padding:10px 14px; font-size:14px; border-color:#f87171; color:#f87171;" onclick="window.skipIntake('${p.id}', '${m.dateISO}')">\u2715</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="border-top: 1px dashed rgba(255,255,255,0.1); margin-bottom: 24px;"></div>
          `;
        })()}

        ${forecastHtml || `<div class="empty-state">${t('noUpcoming')}</div>`}
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:20px;">
        <div class="text-h2" style="font-size:14px; margin-bottom:12px; opacity:0.8;">${t('loggedActivity')}</div>
        ${logsHtml}
      </div>
    </div>
  `;
}

window.confirmIntake = async (planId, plannedDateISO) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  
  const plannedDate = plannedDateISO || new Date().toISOString().split('T')[0];
  
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
    planId: plan.id,
    plannedDate: plannedDate,
    status: 'taken',
    amount_taken: plan.dose,
    linkedMetricIds,
    timestamp: Date.now()
  });
  
  alert(t('loggedSuccess'));
  render();
};

window.skipIntake = async (planId, plannedDateISO) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  
  const plannedDate = plannedDateISO || new Date().toISOString().split('T')[0];
  
  await API.addLog({
    medicationId: plan.medicationId,
    planId: plan.id,
    plannedDate: plannedDate,
    status: 'skipped',
    amount_taken: 0,
    timestamp: Date.now()
  });
  
  render();
};

// 2. Medications
function renderMedications() {
  let listHtml = state.medications.map(m => {
    const formatIcons = {
      'Pill': '\uD83D\uDC8A',
      'Liquid': '\uD83D\uDCA7',
      'Injection': '\uD83D\uDC89',
      'Inhaler': '\uD83D\uDCA8'
    };
    const icon = formatIcons[m.format] || '\uD83D\uDC8A';
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
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
            ${m.hersteller ? `<strong>${m.hersteller}</strong>` : ''}
            ${m.einsatzgebiet ? `${m.hersteller ? ' \u2022 ' : ''}${m.einsatzgebiet}` : ''}
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
          <input type="text" id="med-name" placeholder="E.g., Aspirin" autocomplete="off" style="flex:1;" oninput="window.searchMedicationLocal(this.value)">
          <button class="btn btn-secondary" style="width: auto; padding: 0 15px; background: rgba(99, 102, 241, 0.1); color: var(--accent-color); border: 1px solid rgba(99, 102, 241, 0.3);" onclick="window.searchWithGrok()">
            ${t('searchAi')}
          </button>
        </div>
        <div id="local-search-results" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:100; background:rgba(15, 17, 21, 0.95); backdrop-filter:blur(10px); border:1px solid var(--glass-border); border-radius:12px; margin-top:4px; max-height:200px; overflow-y:auto; box-shadow:0 10px 25px rgba(0,0,0,0.5);"></div>
        <div id="med-fda-adverse" style="display:none; margin-top: 8px; font-size: 11px; color: #f87171; background: rgba(0,0,0,0.2); border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 6px; line-height: 1.4;"></div>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; margin-bottom: 20px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--accent-color); margin-bottom: 8px; text-transform: uppercase;">${t('extendedInfo') || 'Erweiterte Infos'}</div>
        <div style="display: flex; gap: 12px; margin-bottom: 8px;">
          <div class="form-group" style="flex:1; margin:0;">
            <label>${t('hersteller') || 'Hersteller'}</label>
            <input type="text" id="med-hersteller" placeholder="z.B. G.L. Pharma" style="font-size: 12px;">
          </div>
          <div class="form-group" style="flex:1; margin:0;">
            <label>${t('einsatzgebiet') || 'Einsatzgebiet'}</label>
            <input type="text" id="med-einsatzgebiet" placeholder="z.B. Blutdruck" style="font-size: 12px;">
          </div>
        </div>
        
        <div class="form-group" style="margin-top:12px;">
          <label style="font-size:11px; opacity:0.7;">${t('quickSelectArea') || 'Nach Einsatzgebiet suchen:'}</label>
          <select id="area-search-select" onchange="window.searchByArea(this.value)" style="font-size:12px; height:36px; border-color:rgba(255,255,255,0.1);">
            <option value="">${t('chooseArea') || '-- Gebiet wählen --'}</option>
            ${Array.from(new Set(state.localDrugs.map(d => d.einsatzgebiet || d.bereich))).sort().map(a => `<option value="${a}">${a}</option>`).join('')}
          </select>
        </div>
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
  const type = state.planType || 'medication';
  const medOptions = state.medications.map(m => `<option value="${m.id}" data-dose="${m.dose}">${m.name}</option>`).join('');

  let listHtml = state.plans.map(p => {
    const isAppt = p.type === 'appointment';
    let title, subtitle, infoLine;

    if (isAppt) {
      title = `\uD83D\uDEBA ${p.doctorName || t('appointment')}`;
      subtitle = `${p.location ? '\uD83D\uDCCD ' + p.location : ''} ${p.phone ? ' | \uD83D\uDCDE ' + p.phone : ''}`;
      const dt = (p.isOneTime && p.startDate) ? new Date(p.startDate) : null;
      infoLine = dt 
        ? `\uD83D\uDDD3 ${dt.toLocaleDateString()} ${t('at')} ${dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` 
        : `\uD83D\uDDD3 ${t('recurring')}: ${t(p.timeCategory || 'morning')}`;
    } else {
      const med = state.medications.find(m => m.id === p.medicationId) || {name: t('unknown')};
      title = med.name;
      subtitle = `${t('takes')} ${p.dose} ${med.unit || t('units')} ${t('at')} <strong>${t(p.timeCategory || 'morning')}</strong>`;
      
      let freqText = t(p.frequency || 'daily');
      if (p.frequency === 'everyXDays') freqText = t('dayIntervalLbl').replace('{x}', p.intervalX);
      if (p.frequency === 'weekly' && p.startWeekday !== undefined) {
        const days = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
        freqText = `${t('weekly')} (${days[p.startWeekday]})`;
      }
      if ((p.frequency === 'monthly' || p.frequency === 'quarterly') && p.startDayOfMonth !== undefined) {
        freqText = `${t(p.frequency)} (${t('dayOfMonth')}: ${p.startDayOfMonth})`;
      }
      infoLine = freqText;
    }

    return `<div class="card" style="align-items: flex-start;">
      <div style="flex:1; min-width:0;">
        <div class="card-title">${title}</div>
        <div class="card-subtitle" style="word-break:break-word;">${subtitle}</div>
        <div style="font-size: 11px; color: var(--accent-color); margin-top: 4px; font-weight: 600;">${infoLine}</div>
        
        ${!isAppt && p.linkedMetrics && p.linkedMetrics.length > 0 ? `
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
      <button class="btn btn-danger" style="padding: 8px 12px; width: auto; flex-shrink:0;" onclick="window.deletePlan('${p.id}')">${t('remove')}</button>
    </div>`;
  }).join('');

  if (!state.plans.length) listHtml = `<div class="empty-state">${t('noSchedule')}</div>`;

  return `
    <div class="glass-panel" id="add-plan-panel" style="display: ${state.showAddPlanPanel ? 'block' : 'none'};">
      <div class="text-h2">${t('createSchedule')}</div>
      
      <!-- Type Switcher -->
      <div style="display:flex; background:rgba(255,255,255,0.05); border-radius:10px; padding:4px; margin-bottom:20px;">
        <button onclick="window._setPlanType('medication')" style="flex:1; border:none; padding:8px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; background:${type==='medication'?'var(--accent-color)':'transparent'}; color:${type==='medication'?'#000':'#94a3b8'}; transition:all 0.2s;">${t('medication')}</button>
        <button onclick="window._setPlanType('appointment')" style="flex:1; border:none; padding:8px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; background:${type==='appointment'?'var(--accent-color)':'transparent'}; color:${type==='appointment'?'#000':'#94a3b8'}; transition:all 0.2s;">${t('appointment')}</button>
      </div>
      
      ${state.showMagicImport ? `
        <div class="panel" style="margin-bottom:20px; border-color:var(--accent-color); background:rgba(99,102,241,0.05); position:relative;">
          <button onclick="state.showMagicImport=false; render()" style="position:absolute; right:8px; top:8px; background:none; border:none; color:#f87171; cursor:pointer; font-size:16px;">\u00D7</button>
          <div class="text-h2" style="color:var(--accent-color);">\u2728 ${t('magicImportBtn')}</div>
          <div style="font-size:10px; opacity:0.7; margin-bottom:10px;">${t('magicImportInfo')}</div>
          
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px; margin-bottom:12px;">
            <div style="font-size:11px; font-weight:700; margin-bottom:4px;">\uD83D\uDD0D ${t('autoSearchBtn')}</div>
            <div style="font-size:9px; opacity:0.6; margin-bottom:8px;">${t('autoSearchInfo')}</div>
            <button class="btn" onclick="window._runMagicImportAI(true)" style="background:rgba(99,102,241,0.2); color:var(--accent-color); border:1px solid var(--accent-color); font-size:11px;">\uD83D\uDE80 Start Auto-Search</button>
          </div>

          <textarea id="magic-import-text" placeholder="${t('magicImportPlaceholder')}" style="width:100%; height:80px; font-size:12px; margin-bottom:10px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; padding:8px;"></textarea>
          <div id="magic-status"></div>
          <button class="btn" onclick="window._runMagicImportAI()" style="background:var(--accent-color); color:#000; border:none;">\u2728 ${t('magicImportBtn')}</button>
        </div>
      ` : ''}

      ${type === 'medication' ? `
        <!-- Medication Selection -->
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
          ${_renderSharedPlanFields()}
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
        `}
      ` : `
        <!-- Appointment Fields -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:16px; margin-bottom:20px;">
          <div class="form-group">
            <label>${t('doctorName')}</label>
            <input type="text" id="appt-doctor" placeholder="z.B. Dr. Brigitte St\u00F6hr" style="background:rgba(255,255,255,0.05);">
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
            <div class="form-group" style="margin:0;">
              <label>${t('specialty')}</label>
              <select id="appt-specialty" style="font-size:12px; padding:10px;">
                <option value="">${t('anySpecialty')}</option>
                ${(i18n[state.lang].specialties || []).map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label>${t('regionPlaceholder')}</label>
              <div style="position:relative;">
                <input type="text" id="appt-region" placeholder="Ort / PLZ" value="${state.defaultRegion || ''}" style="font-size:12px; padding:10px; padding-right:32px;">
                <button type="button" class="btn btn-secondary" style="position:absolute; right:4px; top:4px; width:28px; height:28px; padding:0; border:none; background:transparent; font-size:12px;" onclick="window._geolocate('appt-region')" title="GPS">\uD83D\uDCCD</button>
              </div>
            </div>
          </div>
          
          <button type="button" class="btn" style="background:var(--accent-color); color:#000; border:none; height:44px; font-weight:700; margin-bottom:12px;" onclick="window.searchDoctorSmart()">
            ${t('doctorSearch')}
          </button>
          
          <div id="doctor-ai-results" style="display:none; padding:12px; background:rgba(0,0,0,0.2); border-radius:10px; border:1px solid rgba(255,255,255,0.05); margin-bottom:8px;"></div>
          
          <div style="text-align:center;">
             <button type="button" style="background:none; border:none; color:var(--accent-color); font-size:10px; text-decoration:underline; cursor:pointer; opacity:0.6;" onclick="window.state.showMagicImport=true; window.render()">
               ${t('magicImportFallback') || 'Manuell einf\u00FCgen (Text/Link)'}
             </button>
          </div>
        </div>

        <div class="form-group">
          <label>${t('location')}</label>
          <input type="text" id="appt-location">
        </div>
        <div class="form-group">
          <label>${t('phone')}</label>
          <input type="text" id="appt-phone">
        </div>
        <div class="form-group">
           <label style="display:flex; align-items:center; gap:8px; font-weight:normal; font-size:13px;">
             <input type="checkbox" id="appt-one-time" onchange="document.getElementById('appt-dt-box').style.display=this.checked?'block':'none'; document.getElementById('appt-recurring-box').style.display=this.checked?'none':'block';">
             ${t('oneTime')}
           </label>
        </div>
        <div id="appt-dt-box" style="display:none;">
           <div class="form-group">
             <input type="datetime-local" id="appt-date">
           </div>
        </div>
        <div id="appt-recurring-box">
          <div class="form-group">
            <label>${t('timeOfDay')}</label>
            <select id="appt-category">
               <option value="morning">${t('morning')}</option>
               <option value="noon">${t('noon')}</option>
               <option value="evening">${t('evening')}</option>
            </select>
          </div>
          ${_renderSharedPlanFields()}
        </div>
        <div class="form-group">
          <label>${t('note')}</label>
          <textarea id="appt-note" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; padding:12px; font-family:inherit; width:100%; height:80px;"></textarea>
        </div>
      `}

      <button class="btn" onclick="window.savePlan()">${t('savePlan')}</button>
      <button class="btn btn-secondary" style="margin-top:12px;" onclick="window._setShowAddPlanPanel(false)">${t('cancel')}</button>
    </div>

    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="text-h2" style="margin: 0;">${t('yourSchedule')}</div>
        <button class="btn" style="width: auto; padding: 8px 16px; font-size: 14px;" onclick="window._setShowAddPlanPanel(true)">${t('newPlan')}</button>
      </div>
      <div class="card-list">
        ${listHtml}
      </div>
    </div>
  `;
}

function _renderSharedPlanFields() {
  return `
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
    <div id="navigation-content"></div>
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
  const medFiltersHtml = state.medications.map(m => {
    const active = state.historyMedFilters.includes(m.id);
    return `<div onclick="window._toggleHistoryFilter('${m.id}')" style="flex-shrink:0; padding:6px 12px; border-radius:30px; font-size:12px; font-weight:700; cursor:pointer; background:${active?'var(--accent-color)':'rgba(255,255,255,0.05)'}; color:${active?'#000':'#94a3b8'}; border:1px solid ${active?'var(--accent-color)':'rgba(255,255,255,0.1)'}; transition:all 0.2s;">${m.name}</div>`;
  }).join('');

  return `
    <div style="display:flex; gap:8px; overflow-x:auto; padding:8px 0; margin-bottom:12px; scrollbar-width:none; -ms-overflow-style:none;">
      <div onclick="window._clearHistoryFilters()" style="flex-shrink:0; padding:6px 12px; border-radius:30px; font-size:12px; font-weight:700; cursor:pointer; background:${state.historyMedFilters.length===0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.05)'}; color:#fff; border:1px solid rgba(255,255,255,0.1);">${t('allMeds') || 'Alle'}</div>
      ${medFiltersHtml}
    </div>
    <div style="padding: 16px 0; display: flex; gap: 8px; margin-bottom: 8px;">
      <button class="btn" style="flex:1; font-weight:700; height:44px; border-radius:12px; background:${state.historyView==='list'?'var(--accent-color)':'rgba(0,0,0,0.2)'}; color:${state.historyView==='list'?'#000':'#94a3b8'}; border:none;" onclick="window._setHistoryView('list')">${t('list')}</button>
      <button class="btn" style="flex:1; font-weight:700; height:44px; border-radius:12px; background:${state.historyView==='charts'?'var(--accent-color)':'rgba(0,0,0,0.2)'}; color:${state.historyView==='charts'?'#000':'#94a3b8'}; border:none;" onclick="window._setHistoryView('charts')">${t('charts')}</button>
    </div>
    ${state.historyView === 'list' ? _renderLogList() : renderAnalytics()}
  `;
}

window._toggleHistoryFilter = (id) => {
  const idx = state.historyMedFilters.indexOf(id);
  if (idx > -1) state.historyMedFilters.splice(idx, 1);
  else state.historyMedFilters.push(id);
  render();
};

window._clearHistoryFilters = () => {
  state.historyMedFilters = [];
  render();
};

function _generateFullHistoryStream() {
  const daysLimit = 14;
  const stream = [];
  const now = new Date();
  
  // 1. Add actual logs
  state.logs.forEach(l => {
    stream.push({ ...l, date: new Date(l.timestamp), type: 'log', status: l.amount_taken > 0 ? 'taken' : 'skipped' });
  });
  
  // 2. Generate missed events from plans
  for (let i = 0; i < daysLimit; i++) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const dateStr = d.toDateString();
    
    state.plans.forEach(p => {
      if (p.type !== 'medication') return;
      if (!window._isPlanDueOnDate(p, d)) return;
      
      // Check if we have a log for this med on this day
      const hasLog = state.logs.some(l => 
        l.medicationId === p.medicationId && 
        new Date(l.timestamp).toDateString() === dateStr
      );
      
      if (!hasLog && d < now) {
        stream.push({
          medicationId: p.medicationId,
          timestamp: d.getTime(),
          date: d,
          type: 'missed',
          amount_taken: 0,
          status: 'missed'
        });
      }
    });
  }
  
  return stream.sort((a,b) => b.timestamp - a.timestamp);
}

function _renderLogList() {
  let stream = _generateFullHistoryStream();
  
  // Apply Filter
  if (state.historyMedFilters.length > 0) {
    stream = stream.filter(s => state.historyMedFilters.includes(s.medicationId));
  }

  const logCards = stream.map(l => {
    const med = state.medications.find(m => m.id === l.medicationId) || {name: t('unknown')};
    const time = new Date(l.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: l.type === 'log' ? 'short' : undefined });
    const isRed = l.status === 'skipped' || l.status === 'missed';
    
    return `
      <div class="swipe-item">
        <button class="swipe-action" onclick="window._deleteHistoryLog('${l.id}')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
        <div class="swipe-content card" style="display:block; padding: 16px; border-left: 3px solid ${isRed ? '#ef4444' : 'transparent'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div class="card-title" style="color: ${isRed ? '#f87171' : 'inherit'}">${med.name}</div>
              <div class="card-subtitle" style="color: ${isRed ? '#f87171' : 'inherit'}">
                 ${l.status === 'missed' ? (t('missed') || 'Nicht eingenommen') : (l.amount_taken + ' ' + (med.unit || t('units')) + ' ' + t('taken'))}
              </div>
            </div>
            <div style="font-size:12px; color:#94a3b8; text-align:right;">${time}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="glass-panel" style="padding-top:0;">
      <div class="card-list">
        ${stream.length > 0 ? logCards : `<div class="empty-state">${t('noLogsToday')}</div>`}
      </div>
    </div>
  `;
}

window._setHistoryView = (view) => {
  state.historyView = view;
  render();
};

function renderSettings() {
  return `
    <div class="glass-panel">
      <div class="text-h2">${t('settings')}</div>
      
      <div class="form-group">
        <label>${t('enteringApiKey')}</label>
        <input type="password" id="grok-api-key-input" value="${state.grokKey}" placeholder="xai-..." style="margin-bottom:8px;">
      </div>

      <div class="form-group">
        <label>${t('defaultRegionLabel')}</label>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" id="grok-region-input" value="${state.defaultRegion || ''}" placeholder="${t('regionPlaceholder')}" style="flex:1; font-size:12px;">
          <button class="btn btn-secondary" style="width:auto; padding:0 12px;" onclick="window._geolocate('grok-region-input')" title="GPS">\uD83D\uDCCD</button>
        </div>
        <div style="font-size:10px; opacity:0.6;">${t('defaultRegionInfo') || 'Wird f\u00FCr die Arztsuche verwendet.'}</div>
      </div>

      <div class="form-group">
        <label>${t('modelIdLabel')}</label>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          ${state.availableModels.length > 0 
            ? `<select id="grok-model-input" style="flex:1;">
                ${state.availableModels.map(m => `<option value="${m}" ${state.grokModel === m ? 'selected' : ''}>${m}</option>`).join('')}
                <option value="custom">${t('customModel')}</option>
               </select>`
            : `<input type="text" id="grok-model-input" value="${state.grokModel}" placeholder="grok-beta" style="flex:1;">`
          }
          <button class="btn btn-secondary" style="width:auto; padding:0 12px; font-size:12px;" onclick="window.fetchGrokModels()" title="${t('refreshModels')}">\uD83D\uDDD8</button>
        </div>
      </div>

      <div class="form-group">
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="grok-livesearch-input" ${state.useLiveSearch ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--accent-color);">
          <span>${t('enableLiveSearch') || 'Live Web-Suche aktivieren'}</span>
        </label>
      </div>

      <div id="settings-msg" style="margin-top:12px; font-size:14px; font-weight:600;"></div>
      <button class="btn" style="margin-top:16px;" onclick="window.saveSettings()">${t('saveSettings') || 'Einstellungen speichern'}</button>
    </div>

    <div class="glass-panel">
      <div class="text-h2">${t('dataManagement')}</div>
      <p class="text-body" style="margin-bottom: 20px;">${t('dataNote')}</p>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn btn-secondary" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="window.exportData()">${t('exportData')}</button>
        <button class="btn btn-secondary" onclick="window.confirmClearLogs()" style="border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.05);">${t('deleteLogs')}</button>
        <button class="btn btn-danger" onclick="window.confirmClearAll()" style="margin-top: 8px;">${t('deleteAllData')}</button>
      </div>

      <div style="border-top: 1px solid var(--glass-border); margin: 24px 0;"></div>
      
      <div class="text-h2">${t('restoreData') || 'Daten wiederherstellen'}</div>
      <input type="file" id="import-file" accept=".json" style="margin-bottom: 12px;">
      <button class="btn btn-secondary" onclick="window.importData()">${t('importRestore')}</button>
      
      <div style="margin-top:32px; padding-top:20px; border-top:1px solid var(--glass-border); text-align:center;">
        <button class="btn btn-secondary" style="background:rgba(74,222,128,0.1); border-color:var(--accent-color); color:var(--accent-color);" onclick="window.checkUpdateManual()">
          ${t('forceUpdateBtn')}
        </button>
        <p style="font-size:10px; opacity:0.5; margin-top:8px;">
          Current: ${APP_VERSION} \u2022 Use if UI seems outdated.
        </p>
      </div>
    </div>
  `;
}

window.saveMed = async () => {
  const id = document.getElementById('med-id').value;
  const name = document.getElementById('med-name').value;
  const dose = document.getElementById('med-dose').value;
  const unit = document.getElementById('med-unit').value;
  const format = document.getElementById('med-format').value;
  const hersteller = document.getElementById('med-hersteller').value;
  const einsatzgebiet = document.getElementById('med-einsatzgebiet').value;
  
  if (!name || !dose) return alert(t('nameAndDose'));
  
  let advEvents = state.pendingAdverseEvents;

  if (id) {
    const existing = state.medications.find(m => m.id === id);
    if (existing && existing.name === name) {
      if (!advEvents) advEvents = existing.adverse_events;
    }
  }
  
  await API.addMedication({ id: id || undefined, name, dose, unit, format, hersteller, einsatzgebiet, adverse_events: advEvents });
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
  document.getElementById('med-hersteller').value = med.hersteller || "";
  document.getElementById('med-einsatzgebiet').value = med.einsatzgebiet || "";
  
  document.getElementById('add-med-title').innerText = t('updateMedication');
  document.getElementById('med-save-btn').innerText = t('saveMedication');
  document.getElementById('add-med-panel').style.display = 'block';

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
  document.getElementById('med-hersteller').value = '';
  document.getElementById('med-einsatzgebiet').value = '';
  document.getElementById('add-med-title').innerText = t('addMedication');
  document.getElementById('add-med-panel').style.display = 'none';
  const advEl = document.getElementById('med-fda-adverse');
  if (advEl) advEl.style.display = 'none';
  const localResEl = document.getElementById('local-search-results');
  if (localResEl) localResEl.style.display = 'none';
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
  // 1. Frequency Parsing
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
  const bullets = text.split(/[\u2022\n;]|\.\s(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 5);
  if (bullets.length > 1) {
    return `
      <ul style="list-style: none; padding: 0;">
        ${bullets.map(b => `
          <li style="margin-bottom: 16px; display: flex; gap: 12px; font-size: 18px; line-height: 1.5; color: #f3f4f6;">
            <span style="color:var(--accent-color); flex-shrink:0;">\u2022</span>
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
  if (p.isOneTime && d.getTime() !== start.getTime()) return false;

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
  try {
    const type = state.planType || 'medication';
    const medicationId = type === 'medication' ? document.getElementById('plan-med')?.value : null;
    const doctorName = type === 'appointment' ? document.getElementById('appt-doctor')?.value : null;
    const location = type === 'appointment' ? document.getElementById('appt-location')?.value : null;
    const phone = type === 'appointment' ? document.getElementById('appt-phone')?.value : null;
    const note = type === 'appointment' ? document.getElementById('appt-note')?.value : null;
    const isOneTime = type === 'appointment' ? document.getElementById('appt-one-time')?.checked : false;
    
    const timeCategory = type === 'medication' ? document.getElementById('plan-category')?.value : (isOneTime ? null : document.getElementById('appt-category')?.value);
    const dose = type === 'medication' ? document.getElementById('plan-dose')?.value : null;
    
    const frequency = document.getElementById('plan-freq')?.value || 'daily';
    const intervalX = document.getElementById('plan-interval-x')?.value || 1;
    const startDateRaw = isOneTime ? document.getElementById('appt-date')?.value : document.getElementById('plan-start-date')?.value;
    const startWeekday = document.getElementById('plan-weekday')?.value || 1;
    const startDayOfMonth = document.getElementById('plan-day-of-month')?.value || 1;
    
    if (type === 'medication' && (!medicationId || !dose)) return alert(t('medAndTime') || 'Select Med and dose');
    if (type === 'appointment' && !doctorName) return alert(t('doctorName') || 'Enter Doctor name');
    
    const linkedMetrics = type === 'medication' ? Array.from(document.querySelectorAll('input[name="link-metric"]:checked')).map(cb => cb.value) : [];
    
    const plan = { 
      type,
      medicationId, 
      doctorName,
      location,
      phone,
      note,
      isOneTime,
      timeCategory, 
      dose, 
      frequency, 
      intervalX, 
      linkedMetrics,
      startDate: startDateRaw ? new Date(startDateRaw).toISOString() : new Date().toISOString(),
      startWeekday,
      startDayOfMonth
    };
    await API.addPlan(plan);
    state.showAddPlanPanel = false;
    render();
  } catch (err) {
    console.error("Save Plan Error:", err);
    alert("Error saving: " + err.message);
  }
};


window.deletePlan = async (id) => {
  if(confirm(t('removeScheduleConfirm'))) {
    await API.deletePlan(id);
    window.navigate('plans');
  }
};

window.searchMedicationLocal = (query) => {
  const resultsEl = document.getElementById('local-search-results');
  if (!query || query.length < 2) {
    resultsEl.style.display = 'none';
    return;
  }

  const q = query.toLowerCase();
  const matches = state.localDrugs.filter(d => 
    d.name.toLowerCase().includes(q) || 
    d.wirkstoff.toLowerCase().includes(q) || 
    (d.einsatzgebiet && d.einsatzgebiet.toLowerCase().includes(q))
  ).slice(0, 10);

  if (matches.length === 0) {
    resultsEl.style.display = 'none';
    return;
  }

  resultsEl.innerHTML = matches.map(m => `
    <div style="padding:10px 14px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" 
         onmouseover="this.style.background='rgba(255,255,255,0.05)'" 
         onmouseout="this.style.background='transparent'"
         onclick="window.applyLocalDrug(${JSON.stringify(m).replace(/"/g, '&quot;')})">
      <div style="font-weight:700; color:var(--accent-color); font-size:13px;">${m.name}</div>
      <div style="font-size:10px; opacity:0.6; margin-top:2px;">${m.wirkstoff} \u2022 ${m.einsatzgebiet || m.bereich}</div>
    </div>
  `).join('');
  resultsEl.style.display = 'block';
};

window.searchByArea = (area) => {
  if (!area) {
    document.getElementById('local-search-results').style.display = 'none';
    return;
  }
  
  const matches = state.localDrugs.filter(d => (d.einsatzgebiet || d.bereich) === area).slice(0, 20);
  const resultsEl = document.getElementById('local-search-results');
  
  resultsEl.innerHTML = matches.map(m => `
    <div style="padding:10px 14px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:background 0.2s;" 
         onmouseover="this.style.background='rgba(255,255,255,0.05)'" 
         onmouseout="this.style.background='transparent'"
         onclick="window.applyLocalDrug(${JSON.stringify(m).replace(/"/g, '&quot;')})">
      <div style="font-weight:700; color:var(--accent-color); font-size:13px;">${m.name}</div>
      <div style="font-size:10px; opacity:0.6; margin-top:2px;">${m.wirkstoff} \u2022 ${m.hersteller}</div>
    </div>
  `).join('');
  resultsEl.style.display = 'block';
};

window.applyLocalDrug = (drug) => {
  document.getElementById('med-name').value = drug.name;
  document.getElementById('med-dose').value = drug.standard_dosis.split(' ')[0].replace(/[^0-9,-]/g, '') || "";
  document.getElementById('med-hersteller').value = drug.hersteller || "";
  document.getElementById('med-einsatzgebiet').value = drug.einsatzgebiet || "";
  document.getElementById('local-search-results').style.display = 'none';
  const areaSelect = document.getElementById('area-search-select');
  if (areaSelect) areaSelect.value = "";
};

window.searchWithGrok = async () => {
  const query = document.getElementById('med-name').value;
  if (!query || query.length < 2) return alert(t('nameAndDose'));

  // Try local search first for non-exact but close matches if not already selected
  const q = query.toLowerCase();
  const localMatch = state.localDrugs.find(d => d.name.toLowerCase() === q);
  if (localMatch) {
    window.applyLocalDrug(localMatch);
    return;
  }

  if (!state.grokKey) {
    alert(t('missingKeyError'));
    window.navigate('settings');
    return;
  }

  const resultsEl = document.getElementById('local-search-results');
  resultsEl.style.display = 'none';

  const adverseEl = document.getElementById('med-fda-adverse');
  adverseEl.style.display = 'block';
  adverseEl.innerHTML = `<div style="color: var(--accent-color);">${t('aiThinking')}</div>`;

  try {
    const promptText = `Identifiziere die wichtigsten Medikamente mit dem Namen oder einem \u00E4hnlichen Brand wie "${query}". 
    Nenne die Namen in einer Liste und f\u00FCge auch Generika an. Sortiere die Liste so, dass die Treffer, die am n\u00E4chsten mit "${query}" \u00FCbereinstimmen (inkl. korrigierter Typos), ganz oben stehen.
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
      adverseEl.innerHTML = `<div style="color: #64748b; font-style: italic;">\u26A0\uFE0F ${t('notFoundAiLabel')}</div>`;
      return;
    }

    let resultsList = [];
    if (Array.isArray(result.results)) {
       resultsList = result.results;
    } else if (result.name) {
       resultsList = [result];
    }
    
    state.pendingGrokResults = resultsList;
    
    if (state.pendingGrokResults.length === 0) {
       adverseEl.innerHTML = `<div style="color: #64748b; font-style: italic;">\u26A0\uFE0F ${t('notFoundAiLabel')}</div>`;
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

window.toggleLang = (lang) => {
  state.lang = lang;
  localStorage.setItem('medilang', lang);
  render();
};

// Translate adverse events text via MyMemory
window.translateAdverse = async (medId, text) => {
  const el = document.getElementById('adv-' + medId);
  if (!el) return;
  if (_advTransCache.has(medId)) {
    el.innerHTML = _advTransCache.get(medId);
    el.style.display = 'block';
    return;
  }
  el.style.display = 'block';
  el.innerHTML = '\u00DCbersetze...';
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

// --- CALENDAR EXPORT HELPERS ---
function _generateICS(events) {
    const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    let icsItems = events.map(e => {
        const desc = (e.description || '').replace(/\n/g, '\\n');
        const loc = (e.location || '').replace(/\n/g, '\\n');
        return [
            'BEGIN:VEVENT',
            `UID:${_uuid()}`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${formatICSDate(e.start)}`,
            `DTEND:${formatICSDate(new Date(e.start.getTime() + 30 * 60 * 1000))}`,
            `SUMMARY:\uD83D\uDC8A ${e.title}`,
            `DESCRIPTION:${desc}`,
            `LOCATION:${loc}`,
            'END:VEVENT'
        ].join('\r\n');
    }).join('\r\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MedicaTrack//Schedule//EN',
        icsItems,
        'END:VCALENDAR'
    ].join('\r\n');
}

// AI DOCTOR SEARCH
window.searchDoctorSmart = async () => {
    const listEl = document.getElementById('doctor-ai-results');
    const name = document.getElementById('appt-doctor').value;
    const specialty = document.getElementById('appt-specialty').value;
    const region = document.getElementById('appt-region').value;

    if (!name && !specialty) return alert(t('nameAndDose'));
    if (!state.grokKey) return alert(t('missingKeyError'));

    listEl.style.display = 'block';
    listEl.innerHTML = `<div style="display:flex; gap:10px; align-items:center; font-size:11px; color:var(--accent-color);">
      <div style="width:16px; height:16px; border:2px solid var(--accent-color); border-top-color:transparent; border-radius:50%; animation: spin 0.8s linear infinite;"></div> 
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      ${t('aiThinking') || 'Suche im Internet...'}
    </div>`;

    try {
      const prompt = `Search for a medical professional matching:
      Name: ${name || 'any'}
      Specialty: ${specialty || 'any'}
      City/Region: ${region || 'any'}
      
      INSTRUCTIONS:
      1. Perform a live web search to identify REAL, currently practicing doctors.
      2. If multiple are found, list up to 5 best matches.
      3. For each one, provide the full business Name, Address, and Phone.
      4. DO NOT hallucinate. Only return doctors you can verify online.
      
      RESPONSE FORMAT (JSON only):
      {
        "doctors": [
          { "name": "Dr. ...", "address": "Full Address", "phone": "Phone Number", "specialty": "..." }
        ]
      }`;

      const res = await fetch(GROK_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.grokKey}` },
        body: JSON.stringify({
          model: state.grokModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          tools: [{ type: "web_search" }]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error ${res.status}`);
      }

      const d = await res.json();
      let content = d.choices[0].message.content || "";
      
      if (!content && d.choices[0].message.tool_calls) {
         throw new Error("Web search tool was triggered but no results were returned. Please try a different model (e.g. grok-2 or reasoning models).");
      }
      
      // Extract JSON if model included extra text
      if (content.includes('```json')) content = content.split('```json')[1].split('```')[0].trim();
      else if (content.includes('{')) content = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);

      const data = JSON.parse(content);
      const doctors = data.doctors || [];

      if (doctors.length === 0) {
        listEl.innerHTML = `<div style="font-size:11px; opacity:0.6;">${t('doctorNotFoundAi')}</div>`;
        return;
      }

      listEl.innerHTML = `
        <div style="font-size:10px; font-weight:700; margin-bottom:8px; opacity:0.6; color:#fde047;">\u26A0\uFE0F ${t('aiAccuracyWarning')}</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${doctors.map((doc, i) => `
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px;">
              <div style="color:var(--accent-color); font-size:12px; font-weight:700;">${doc.name}</div>
              <div style="font-size:10px; opacity:0.7; margin:4px 0;">\uD83D\uDCCD ${doc.address || '?'}<br>\uD83D\uDCDE ${doc.phone || '?'}</div>
              <button type="button" class="btn btn-secondary" style="height:28px; font-size:10px; background:var(--accent-color); color:#000; border:none;" onclick="window._applyDoctorSmart(${i}, ${JSON.stringify(doctors).replace(/"/g, '&quot;')})">
                ${t('chooseOption')}
              </button>
            </div>
          `).join('')}
        </div>
      `;
    } catch(err) {
      listEl.innerHTML = `<div style="color:#f87171; font-size:10px;">Error: ${err.message}. Try refining your search.</div>`;
    }
};

window._applyDoctorSmart = (i, list) => {
    const doc = list[i];
    document.getElementById('appt-doctor').value = doc.name;
    document.getElementById('appt-location').value = doc.address || "";
    document.getElementById('appt-phone').value = doc.phone || "";
    document.getElementById('doctor-ai-results').style.display = 'none';
};

window.searchDoctorSmart = async () => {
  const name = document.getElementById('appt-doctor').value;
  const region = document.getElementById('appt-region').value;
  const specialty = document.getElementById('appt-specialty').value;
  const listEl = document.getElementById('doctor-ai-results');
  
  if (!region) {
    listEl.style.display = 'block';
    listEl.innerHTML = `<div style="font-size:11px; color:#ef4444; background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;">
      \u26A0\uFE0F ${t('defaultRegionLabel')} 
    </div>`;
    return;
  }

  if (!name && !specialty) return alert(t('doctorName') + ' / ' + t('specialty'));
  
  if (!state.grokKey) {
    listEl.style.display = 'block';
    listEl.innerHTML = `<div style="font-size:11px; color:#ef4444; background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;">
      ${t('missingKeyError')}
    </div>`;
    return;
  }

  listEl.style.display = 'block';
  listEl.innerHTML = `<span style="font-size:11px; color:var(--accent-color);">${t('testingKey')}...</span>`;

  try {
    const regionText = region ? ` in "${region}"` : '';
    const nameText = name ? (specialty ? `named "${name}" specializing in "${specialty}"` : `named "${name}"`) : `specializing in "${specialty}"`;
    
    // HIGH ACCURACY SEARCH PROMPT
    const prompt = `You are a medical directory expert. TASK: Find the official and verified contact details for: ${nameText}${regionText}.
    
    ACCURACY RULES:
    1. SEARCH FIRST: Use the web to find the EXACT professional requested.
    2. VERIFY: Ensure the address and phone number are currently active.
    3. FALLBACK: If the specific doctor is not found, list up to 3 real alternatives of the same specialty in "${region}".
    4. DATA QUALITY: No placeholder data. Return only if reasonably certain.
    5. RESPONSE FORMAT: Return ONLY a valid JSON object: {"doctors": [{"name": "...", "specialty": "...", "address": "...", "phone": "..."}]}.
    6. Language: ${state.lang === 'de' ? 'German' : 'English'}.`;

    const body = {
      model: state.grokModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    };

    // ENABLE LIVE WEB SEARCH TOOL
    if (state.useLiveSearch) {
      body.tools = [{ type: "web_search" }];
    } else {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.grokKey}` },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ? errData.error.message : `API Error ${res.status}`);
    }

    const d = await res.json();
    let content = d.choices[0].message.content || "";
    
    if (!content && d.choices[0].message.tool_calls) {
        throw new Error("The model requested a tool call but did not provide a final answer. Please ensure you are using a reasoning model like grok-4.20-reasoning.");
    }

    try {
      // Fallback parser: Extract JSON if model included text
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('{')) {
        content = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      }
      
      const result = JSON.parse(content);
      const results = result.doctors || [];

    if (results.length === 0) {
      const googleQuery = encodeURIComponent(`${name} ${specialty || ''} ${region}`);
      listEl.innerHTML = `
        <div style="font-size:11px; color:#94a3b8; margin-bottom:12px;">${t('doctorNotFoundAi')}</div>
        <a href="https://www.google.com/search?q=${googleQuery}" target="_blank" class="btn btn-secondary" style="display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; border-color:var(--accent-color); color:var(--accent-color);">
          \uD83D\uDD0D ${t('searchGoogle')}
        </a>
      `;
      return;
    }

    listEl.innerHTML = `
      <div style="font-size:10px; font-weight:700; margin-bottom:12px; opacity:0.6; display:flex; align-items:center; gap:6px; color:#fde047;">
        \u26A0\uFE0F ${t('aiAccuracyWarning')}
      </div>
      <div style="font-size:10px; font-weight:700; margin-bottom:4px; opacity:0.6;">${t('doctorSelect')}:</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${results.map((doc, i) => {
          const isNearby = doc.address && region && !doc.address.toLowerCase().includes(region.split(',')[0].trim().toLowerCase());
          
          return `
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; flex-direction:column; gap:2px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:4px;">
                  <div style="color:var(--accent-color); font-size:13px; font-weight:700;">${doc.name}</div>
                  ${isNearby ? `<div style="font-size:8px; background:rgba(253,224,71,0.1); color:#fde047; padding:2px 6px; border-radius:4px; white-space:nowrap; border:1px solid rgba(253,224,71,0.2);">\uD83D\uDCCD nearby</div>` : ''}
                </div>
                ${doc.specialty ? `<div style="font-size:10px; color:#94a3b8; font-weight:600; margin-bottom:2px;">\uD83E\uDE7A ${doc.specialty}</div>` : ''}
                <div style="font-size:10px; opacity:0.7; display:flex; gap:4px; align-items:center;">
                  <span style="font-size:12px;">\uD83D\uDCCD</span> ${doc.address || '\u2014'}
                </div>
                ${doc.phone ? `
                  <div style="font-size:10px; opacity:0.7; display:flex; gap:4px; align-items:center;">
                    <span style="font-size:12px;">\uD83D\uDCDE</span> ${doc.phone}
                  </div>
                ` : ''}
              </div>
              <button type="button" class="btn" style="height:42px; padding:0; font-size:14px; background:var(--accent-color); color:#000; border:none; font-weight:700;" onclick="window._applyDoctorMatch(${i}, ${JSON.stringify(results).replace(/"/g, '&quot;')})">
                \u2705 \u00DCbernehmen
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    } catch(parseErr) {
      throw new Error(`Data format error. Raw message from AI: "${content.substring(0, 500)}..."`);
    }
  } catch(e) {
    listEl.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:12px; padding:12px; color:#f87171; font-size:11px;">
        <div style="font-weight:700; margin-bottom:4px;">Search Error</div>
        ${e.message}
        <div style="margin-top:8px; opacity:0.8; font-size:10px;">
          \uD83D\uDCA1 Tip: Try disabling "Live Web Search" or changing the model to "grok-4.20-reasoning".
        </div>
      </div>
    `;
  }
};

window._runMagicImportAI = async (isAuto = false) => {
  let text = document.getElementById('magic-import-text')?.value || "";
  if (isAuto) {
      const name = document.getElementById('appt-doctor')?.value || "";
      const specialty = document.getElementById('appt-specialty')?.value || "";
      const region = document.getElementById('appt-region')?.value || "";
      if (!name && !specialty) return alert("Please enter at least a name or specialty to search.");
      text = `Search for: ${name} ${specialty} in region ${region}`;
  }
  
  const statusEl = document.getElementById('magic-status');
  if (!text.trim()) return;
  if (!state.grokKey) return alert(t('missingKeyError'));

  statusEl.innerHTML = `<div style="font-size:11px; color:var(--accent-color); margin-bottom:8px;">${t('importing')}</div>`;
  
  try {
    const prompt = isAuto 
      ? `You are an automated research assistant. 
         TASK: Search the web for a medical professional matching: "${text}".
         
         INSTRUCTIONS:
         1. Use web search to find the official practice website or most reliable listing (e.g., DocFinder, Google Maps).
         2. Visit the site and extract current contact details.
         3. Return exactly one result in JSON format.
         
         RESPONSE FORMAT (JSON only):
         {
           "name": "Full name with Dr. title",
           "address": "Full address",
           "phone": "Phone number",
           "specialty": "Medical specialty"
         }`
      : `You are a data extraction assistant. Extract professional details from the following raw text OR URL:
         "${text}"
    
         CRITICAL INSTRUCTIONS:
         1. If the input is a URL, you MUST browse the website or search for it to find the practitioner's Name, Address, and Phone.
         2. RESPONSE FORMAT (JSON only):
         {
           "name": "Full name with Dr. title",
           "address": "Full address",
           "phone": "Phone number",
           "specialty": "Medical specialty"
         }
    
         If any field is missing, use null. Return ONLY the JSON object.`;

    const body = {
        model: state.grokModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0
    };

    // ENABLE WEB SEARCH FOR URL BROWSING
    body.tools = [{ type: "web_search" }];

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.grokKey}` },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error ${res.status}`);
    }

    const d = await res.json();
    let content = d.choices[0].message.content || "";
    
    if (!content && d.choices[0].message.tool_calls) {
        throw new Error("Web search tool was used but no final answer was returned. Ensure you are using a reasoning model.");
    }

    // Fallback parser: Extract JSON if model included text
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('{')) {
      content = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
    }
    
    const result = JSON.parse(content);
    
    document.getElementById('appt-doctor').value = result.name || "";
    document.getElementById('appt-location').value = result.address || "";
    if (result.phone) {
        // Find existing phone input or just add to address
        document.getElementById('appt-location').value += ` (Tel: ${result.phone})`;
    }
    if (result.specialty) {
        // Handle specialty if needed
    }
    
    state.showMagicImport = false;
    render();
  } catch(e) {
    statusEl.innerHTML = `<div style="color:#f87171; font-size:10px; margin-bottom:8px;">Error: ${e.message}</div>`;
  }
};

window._applyDoctorMatch = (i, results) => {
  const doc = results[i];
  document.getElementById('appt-doctor').value = doc.name;
  document.getElementById('appt-location').value = doc.address || "";
  document.getElementById('appt-phone').value = doc.phone || "";
  document.getElementById('doctor-ai-results').style.display = 'none';
};

window._setPlanType = (type) => { state.planType = type; render(); };
window._setShowAddPlanPanel = (val) => { state.showAddPlanPanel = val; render(); };

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
  const region = document.getElementById('grok-region-input').value;
  const liveSearch = document.getElementById('grok-livesearch-input').checked;
  state.defaultRegion = region;
  localStorage.setItem('default_region', region);
  state.useLiveSearch = liveSearch;
  localStorage.setItem('use_live_search', liveSearch);
  if (!key || !model) return alert(t('enteringApiKey'));
  state.grokKey = key;
  state.grokModel = model;
  localStorage.setItem('grok_api_key', key);
  localStorage.setItem('grok_model', model);
  const msgEl = document.getElementById('settings-msg');
  msgEl.innerHTML = `<span style="color: #10b981;">\u2705 ${t('settingsSavedLabel')}</span>`;
  setTimeout(() => msgEl.innerText = '', 3000);
};

window.fetchGrokModels = async () => {
  if (!state.grokKey) return alert(t('missingKeyError'));
  try {
    const res = await fetch("https://api.x.ai/v1/models", { headers: { "Authorization": `Bearer ${state.grokKey}` } });
    const data = await res.json();
    if (data.data) {
      state.availableModels = data.data.map(m => m.id).sort();
      localStorage.setItem('grok_available_models', JSON.stringify(state.availableModels));
      render();
    }
  } catch (e) { alert(t('aiError')); }
};

window.exportData = async () => {
  const jsonString = await API.exportData();
  const blob = new Blob([jsonString], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medicatrack_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

window.importData = async () => {
  const fileInput = document.getElementById('import-file');
  if(!fileInput.files.length) return alert(t('selectFile'));
  const reader = new FileReader();
  reader.onload = async (e) => {
    try { await API.importData(e.target.result); window.navigate('dashboard'); } catch(err) { alert(t('importError')); }
  };
  reader.readAsText(fileInput.files[0]);
};

window.confirmClearAll = async () => { if (confirm(t('confirmDeleteAll'))) { await API.clearAllData(); window.navigate('dashboard'); } };
window.confirmClearLogs = async () => { if (confirm(t('confirmDeleteLogs'))) { await API.clearLogs(); window.navigate('dashboard'); } };
window.resetToday = async () => { await API.clearTodayLogs(); window.navigate('dashboard'); };

window.generateTestData = async (countVal) => {
    if (state.medications.length === 0) return alert(t('addMedFirst'));
    const count = parseInt(countVal) || 50;
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        const timestamp = now - Math.random() * (30 * 24 * 60 * 60 * 1000);
        const med = state.medications[Math.floor(Math.random() * state.medications.length)];
        await API.addLog({ medicationId: med.id, amount_taken: med.dose || 1, timestamp, isTestData: true });
    }
    alert(`${count} test entries generated!`);
    window.navigate('history');
};

window.confirmClearTestData = async () => { 
  if (confirm(t('clearTestBtn') + "?")) { 
    await API.clearTestData(); 
    window.navigate('dashboard'); 
  } 
};

function renderAnalytics() {
    const r = state.analyticsRange || 7;
    return `<div class="glass-panel" style="padding-top:0;">
        <div style="display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:8px;">
          <button class="btn btn-secondary" onclick="window._setAnalyticsRange(7)" style="${r===7?'background:var(--accent-color);color:#000;':''}">7D</button>
          <button class="btn btn-secondary" onclick="window._setAnalyticsRange(30)" style="${r===30?'background:var(--accent-color);color:#000;':''}">30D</button>
        </div>
        <div id="chart-adherence" style="min-height: 200px;"></div>
        <div id="chart-weight" style="min-height: 200px; margin-top:20px;"></div>
    </div>`;
}

window._setAnalyticsRange = (r) => { state.analyticsRange = r; render(); };

async function _initCharts() {
    if (typeof ApexCharts === 'undefined') return setTimeout(_initCharts, 200);
    const range = state.analyticsRange || 7;
    const dates = [];
    for (let i = range - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        dates.push(d);
    }
    
    const adherenceData = dates.map(date => {
        let plans = state.plans.filter(p => window._isPlanDueOnDate(p, date));
        let logs = state.logs.filter(l => new Date(l.timestamp).toDateString() === date.toDateString());
        
        // Filter by history selection if in history view
        if (state.currentView === 'history' && state.historyMedFilters.length > 0) {
          plans = plans.filter(p => state.historyMedFilters.includes(p.medicationId));
          logs = logs.filter(l => state.historyMedFilters.includes(l.medicationId));
        }
        
        const due = plans.length;
        if (due === 0) return 0;
        const taken = logs.filter(l => l.amount_taken > 0).length;
        return Math.min(100, Math.round((taken / due) * 100));
    });
    new ApexCharts(document.querySelector("#chart-adherence"), {
        series: [{ name: t('adherence'), data: adherenceData }],
        chart: { type: 'bar', height: 200, toolbar: { show: false } },
        theme: { mode: 'dark' },
        colors: ['#6366f1'],
        xaxis: { categories: dates.map(d => d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })) },
        yaxis: { labels: { formatter: (val) => Math.floor(val) } }
    }).render();
}

window.downloadICS = (id) => { window._exportSingleEvent(id, new Date().toISOString()); };

window._exportSingleEvent = (planId, dateStr) => {
    const p = state.plans.find(x => x.id === planId);
    if (!p) return;
    const isAppt = p.type === 'appointment';
    const med = !isAppt ? state.medications.find(m => m.id === p.medicationId) : null;
    const eventDate = new Date(dateStr);
    const title = isAppt ? p.doctorName : `${med.name} (${p.dose})`;
    const icsContent = _generateICS([{ title, start: eventDate, description: "", location: p.location || "" }]);
    _downloadBlob(icsContent, `Reminder.ics`);
};

window._exportWeeklyEvents = () => { alert("Exporting..."); };

window._autoUpdateCheck = async () => {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.version && data.version !== APP_VERSION) {
      if (!sessionStorage.getItem('medica_updated')) {
        console.log(`Auto-Updating: ${APP_VERSION} -> ${data.version}`);
        sessionStorage.setItem('medica_updated', 'true');
        await window._forceReload();
      }
    }
  } catch (e) { console.warn("Auto-update check failed", e); }
};

window.checkUpdateManual = async () => {
  const btn = event?.target;
  const originalText = btn ? btn.innerText : '';
  if (btn) btn.innerText = "...";
  
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`);
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    const newVer = data.version;
    
    if (newVer && newVer !== APP_VERSION) {
      window._showUpdatePopup(APP_VERSION, newVer);
    } else {
      alert(t('upToDate'));
    }
  } catch (e) {
    alert("Check failed. Performing fallback reload...");
    window._forceReload();
  } finally {
    if (btn) btn.innerText = originalText;
  }
};

window._showUpdatePopup = (oldVer, newVer) => {
  const app = document.getElementById('app');
  let overlay = document.getElementById('update-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'update-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 3000; display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      padding: 20px;
    `;
    app.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="glass-panel" style="max-width: 320px; width: 100%; padding: 24px; text-align: center; border: 1px solid var(--accent-color); box-shadow: 0 0 40px rgba(74, 222, 128, 0.15);">
      <div style="width: 64px; height: 64px; background: rgba(74, 222, 128, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--accent-color);">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </div>
      <div class="text-h2" style="color: var(--accent-color); margin-bottom: 8px;">${t('updateAvailable')}</div>
      <p style="font-size: 13px; opacity: 0.7; margin-bottom: 24px;">A new version of MedicaTrack is ready.</p>
      
      <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 32px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="text-align: left;">
          <div style="font-size: 9px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${t('currentVersion')}</div>
          <div style="font-size: 16px; font-weight: 700; opacity: 0.6;">${oldVer}</div>
        </div>
        <div style="opacity: 0.3;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 9px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${t('newVersion')}</div>
          <div style="font-size: 16px; font-weight: 700; color: var(--accent-color);">${newVer}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn" onclick="window._forceReload()">${t('updateNow')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('update-overlay').style.display='none'">${t('cancel')}</button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    
    // Auto-identify location on first start if not set
    if (!state.defaultRegion && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
          const postcode = data.address.postcode || '';
          const country = data.address.country || '';
          if (city) {
            let locParts = [city];
            if (postcode) locParts.push(postcode);
            if (country) locParts.push(country);
            state.defaultRegion = locParts.join(', ');
            localStorage.setItem('default_region', state.defaultRegion);
            // Render to update Settings view if user happens to be there
            if (state.currentView === 'settings') render();
          }
        } catch (e) { console.warn("Auto-location failed", e); }
      }, (err) => { console.warn("Geolocation permission denied or failed", err); }, { timeout: 5000 });
    }
    
    await window.navigate('dashboard');
    window._autoUpdateCheck();
    
    // Load local drugs database
    try {
      const res = await fetch(`/drugs.json?v=${APP_VERSION}`);
      if (res.ok) {
        const data = await res.json();
        state.localDrugs = data.kategorien.flatMap(k => k.eintraege.map(e => ({ ...e, bereich: k.bereich })));
      }
    } catch (e) { console.warn("Failed to load local drugs", e); }
  } catch (err) { document.getElementById('app').innerHTML = `<div style="padding:40px; color:white;">Error: ${err.message}</div>`; }
});

window._forceReload = async () => {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (let r of regs) await r.unregister();
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    for (let k of keys) await caches.delete(k);
  }
  window.location.reload(true);
};

window._deleteHistoryLog = async (id) => {
  if (confirm(t('confirmDeleteLogs'))) {
    await API.deleteLog(id);
    await loadData();
    render();
  }
};

// Global Swipe Handler
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let activeSwipeItem = null;
let isScrolling = false;

document.addEventListener('touchstart', (e) => {
  const content = e.target.closest('.swipe-content');
  if (!content) {
    if (activeSwipeItem) {
       activeSwipeItem.style.transform = 'translateX(0)';
       activeSwipeItem = null;
    }
    return;
  }
  
  if (activeSwipeItem && activeSwipeItem !== content) {
    activeSwipeItem.style.transform = 'translateX(0)';
  }
  
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  activeSwipeItem = content;
  content.style.transition = 'none';
  isScrolling = false;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!activeSwipeItem || isScrolling) return;
  
  touchCurrentX = e.touches[0].clientX;
  const touchCurrentY = e.touches[0].clientY;
  
  const diffX = touchCurrentX - touchStartX;
  const diffY = touchCurrentY - touchStartY;
  
  // Decide if scrolling or swiping
  if (!isScrolling && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
    isScrolling = true;
    activeSwipeItem.style.transform = 'translateX(0)';
    return;
  }

  // Only start swiping if horizontal intent is clear (threshold)
  if (diffX < -15 && Math.abs(diffX) > Math.abs(diffY)) {
    // Prevent accidental scroll once swiping starts
    if (e.cancelable) e.preventDefault(); 
    activeSwipeItem.style.transform = `translateX(${diffX}px)`;
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (!activeSwipeItem) return;
  activeSwipeItem.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
  const diff = touchCurrentX - touchStartX;
  
  if (diff < -65) {
    activeSwipeItem.style.transform = 'translateX(-80px)';
  } else {
    activeSwipeItem.style.transform = 'translateX(0)';
    activeSwipeItem = null;
  }
  touchStartX = 0;
  touchStartY = 0;
  touchCurrentX = 0;
  isScrolling = false;
});
function _updateNavUI() {
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone) document.body.classList.add('is-pwa');
  else document.body.classList.remove('is-pwa');

  const views = ['dashboard', 'medications', 'plans', 'history'];
  views.forEach(v => {
    const el = document.getElementById(`nav-${v}`);
    if (!el) return;
    
    // Set Active
    if (state.currentView === v) {
      el.classList.add('active');
      el.style.filter = 'drop-shadow(0 0 8px var(--accent-color))';
    } else {
      el.classList.remove('active');
      el.style.filter = '';
    }
    
    // Set text (i18n)
    const textEl = el.querySelector('.nav-text');
    if (textEl) {
      const key = textEl.getAttribute('data-key');
      textEl.innerText = t(key);
    }
  });
}

function _renderInstallPrompt() {
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const hasBeenDismissed = localStorage.getItem('med_install_dismissed');
  
  if (isiOS && !isStandalone && !hasBeenDismissed) {
    return `
      <div id="install-prompt" class="glass-panel" style="margin-top:20px; padding:16px; border:1px solid var(--accent-color); animation: slideUp 0.5s ease-out;">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div style="display:flex; gap:12px; align-items:center;">
             <div style="background:var(--accent-color); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#000;">
               <svg style="width:20px;height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
             </div>
             <div>
               <div style="font-weight:600; font-size:14px;">Als App installieren</div>
               <div style="font-size:12px; color:var(--text-secondary);">Keine Safari-Leisten & mehr Platz</div>
             </div>
          </div>
          <button onclick="window._dismissInstall()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">✕</button>
        </div>
        <div style="margin-top:12px; font-size:12px; line-height:1.4;">
          Tippe auf das <svg style="width:16px;height:16px;vertical-align:middle;display:inline;" viewBox="0 0 24 24"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg> <b>Teilen-Symbol</b> und wähle <b>"Zum Home-Bildschirm"</b>.
        </div>
      </div>
    `;
  }
  return '';
}

window._dismissInstall = () => {
  localStorage.setItem('med_install_dismissed', '1');
  const el = document.getElementById('install-prompt');
  if (el) el.style.display = 'none';
};

// Start detection
_updateNavUI();
