import { state } from '../state.js';
import { t } from '../utils.js';
import { GROK_BASE_URL } from '../constants.js';

const _advTransCache = new Map();

export async function searchWithGrok() {
  const query = document.getElementById('med-name').value;
  if (!query || query.length < 2) return alert(t('nameAndDose'));

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

  const adverseEl = document.getElementById('med-fda-adverse');
  adverseEl.style.display = 'block';
  adverseEl.innerHTML = `<div style="color: var(--accent-color);">${t('aiThinking')}</div>`;

  try {
    const promptText = `Identifiziere die wichtigsten Medikamente mit dem Namen oder einem ähnlichen Brand wie "${query}". 
    Return as JSON array of objects in a "results" field.
    Structure: {"results": [{"name": "...", "generic_name": "...", "default_dose": "...", "unit": "...", "format": "...", "adverse_events": "..."}]}
    Language: ${state.lang === 'de' ? 'German' : 'English'}.
    ONLY valid JSON.`;

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.grokKey}` },
      body: JSON.stringify({
        model: state.grokModel,
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);

    if (result.error === "NOT_FOUND") {
      adverseEl.innerHTML = `<div style="color: #64748b; font-style: italic;">⚠️ ${t('notFoundAiLabel')}</div>`;
      return;
    }

    state.pendingGrokResults = result.results || [];
    if (state.pendingGrokResults.length === 0) {
      adverseEl.innerHTML = `<div style="color: #64748b; font-style: italic;">⚠️ ${t('notFoundAiLabel')}</div>`;
      return;
    }

    if (state.pendingGrokResults.length === 1) {
      window.applyGrokMatch(0);
      return;
    }

    let html = `<div style="margin-bottom:10px;"><strong>${t('multipleFound')}</strong></div><div style="display:flex; flex-direction:column; gap:6px;">`;
    state.pendingGrokResults.forEach((m, idx) => {
      html += `<button class="btn btn-secondary" style="text-align:left; padding:8px; font-size:12px;" onclick="window.applyGrokMatch(${idx})">${m.name} <span style="opacity:0.6; font-size:10px;">(${m.generic_name})</span></button>`;
    });
    html += `</div>`;
    adverseEl.innerHTML = html;
  } catch (err) {
    adverseEl.innerHTML = `<div style="color: #ef4444;">${t('aiError')}<br><span style="font-size:10px; opacity:0.8;">${err.message}</span></div>`;
  }
}

export async function translateAdverse(medId, text) {
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
  } catch (e) { el.innerHTML = text; }
}

export async function runAISearchOnly() {
  const listEl = document.getElementById('doctor-ai-results');
  const name = document.getElementById('appt-doctor').value;
  const specialty = document.getElementById('appt-specialty').value;
  const region = document.getElementById('appt-region').value;

  if (!region) {
    listEl.innerHTML = `<div style="font-size:11px; color:#ef4444; background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;">⚠️ ${t('defaultRegionLabel')}</div>`;
    return;
  }
  if (!state.grokKey) {
    listEl.innerHTML = `<div style="font-size:11px; color:#ef4444; background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;">${t('missingKeyError')}</div>`;
    return;
  }

  listEl.style.display = 'block';
  listEl.innerHTML = `<div style="display:flex; gap:10px; align-items:center; font-size:11px; color:var(--accent-color);"><div class="spinner"></div> ${t('aiThinking')}</div>`;

  try {
    const regionText = region ? ` in "${region}"` : '';
    const nameText = name ? (specialty ? `named "${name}" specializing in "${specialty}"` : `named "${name}"`) : `specializing in "${specialty}"`;
    const prompt = `Find professional contact details for: ${nameText}${regionText}. Return ONLY JSON: {"doctors": [{"name": "...", "specialty": "...", "address": "...", "phone": "..."}]}. Language: ${state.lang === 'de' ? 'German' : 'English'}.`;

    const body = { model: state.grokModel, messages: [{ role: "user", content: prompt }], temperature: 0 };
    if (state.useLiveSearch) body.tools = [{ type: "web_search" }];
    else body.response_format = { type: "json_object" };

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.grokKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(res.statusText);
    const d = await res.json();
    let content = d.choices[0].message.content || "";
    if (content.includes('```json')) content = content.split('```json')[1].split('```')[0].trim();
    else if (content.includes('{')) content = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);

    const data = JSON.parse(content);
    const doctors = data.doctors || [];

    if (doctors.length === 0) {
      listEl.innerHTML = `<div style="font-size:11px; opacity:0.6;">Keine Ergebnisse gefunden.</div>`;
      return;
    }

    listEl.innerHTML = `
        <div style="font-size:10px; font-weight:700; margin-bottom:8px; opacity:0.6; color:#fde047;">⚠️ ${t('aiAccuracyWarning')}</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${doctors.map((doc, i) => `
            <div class="card" style="padding:10px;">
              <div style="font-weight:700; color:var(--accent-color); font-size:12px;">${doc.name}</div>
              <div style="font-size:10px; opacity:0.8; margin:4px 0;">${doc.specialty}</div>
              <div style="font-size:10px; opacity:0.6; margin:4px 0;">📍 ${doc.address}<br>📞 ${doc.phone}</div>
              <button type="button" class="btn btn-secondary" style="height:28px; font-size:10px; background:var(--accent-color); color:#000; border:none; margin-top:4px;" onclick="window._applyDoctorSmart(${i}, ${JSON.stringify(doctors).replace(/"/g, '&quot;')})">
                ${t('chooseOption')}
              </button>
            </div>
          `).join('')}
        </div>
    `;
  } catch (err) {
    listEl.innerHTML = `<div style="font-size:11px; color:#ef4444;">${t('aiError')}</div>`;
  }
}

// Expose to window for legacy support
export async function magicImport() {
  const text = document.getElementById('magic-import-text').value;
  if (!text) return;
  if (!state.grokKey) return alert(t('missingKeyError'));

  const statusEl = document.getElementById('magic-import-status');
  statusEl.innerHTML = `<div style="color:var(--accent-color); font-size:12px;">${t('importing')}</div>`;

  try {
    const prompt = `Extract medical contact or medication info from: "${text}". 
    Return JSON: {"type": "doctor|medication", "data": {...}}.
    If doctor: {"name": "...", "specialty": "...", "address": "...", "phone": "...", "note": "..."}.
    If medication: {"name": "...", "dose": "...", "unit": "...", "format": "...", "hersteller": "...", "einsatzgebiet": "..."}.
    ONLY JSON.`;

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.grokKey}` },
      body: JSON.stringify({
        model: state.grokModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    const d = await res.json();
    const result = JSON.parse(d.choices[0].message.content);

    if (result.type === 'doctor') {
      document.getElementById('appt-doctor').value = result.data.name || '';
      document.getElementById('appt-specialty').value = result.data.specialty || '';
      document.getElementById('appt-region').value = result.data.address || '';
      document.getElementById('appt-phone').value = result.data.phone || '';
      document.getElementById('appt-note').value = result.data.note || '';
    } else if (result.type === 'medication') {
      document.getElementById('med-name').value = result.data.name || '';
      document.getElementById('med-dose').value = result.data.dose || '';
      document.getElementById('med-unit').value = result.data.unit || 'mg';
      document.getElementById('med-format').value = result.data.format || 'Pill';
      document.getElementById('med-hersteller').value = result.data.hersteller || '';
      document.getElementById('med-einsatzgebiet').value = result.data.einsatzgebiet || '';
    }
    statusEl.innerHTML = '';
  } catch (e) {
    statusEl.innerHTML = `<div style="color:#ef4444; font-size:11px;">${t('aiError')}</div>`;
  }
}

export async function fetchGrokModels() {
  if (!state.grokKey) return;
  const btn = document.getElementById('refresh-models-btn');
  if (btn) btn.innerText = "...";
  try {
    const res = await fetch("https://api.x.ai/v1/models", {
      headers: { "Authorization": `Bearer ${state.grokKey}` }
    });
    if (res.ok) {
      const data = await res.json();
      state.availableModels = data.models.map(m => m.id);
      window.render();
    }
  } catch (e) { console.warn("Models fetch failed", e); }
  finally { if (btn) btn.innerText = "🔄"; }
}

window.searchWithGrok = searchWithGrok;
window.translateAdverse = translateAdverse;
window._runAISearchOnly = runAISearchOnly;
window.magicImport = magicImport;
window.fetchGrokModels = fetchGrokModels;

window._applyDoctorSmart = (idx, list) => {
  const doc = list[idx];
  document.getElementById('appt-doctor').value = doc.name;
  document.getElementById('appt-region').value = doc.address;
  document.getElementById('appt-phone').value = doc.phone;
  document.getElementById('appt-specialty').value = doc.specialty;
  document.getElementById('doctor-ai-results').style.display = 'none';
};

window.applyGrokMatch = (idx) => {
  const m = state.pendingGrokResults[idx];
  document.getElementById('med-name').value = m.name;
  document.getElementById('med-dose').value = m.default_dose || "";
  document.getElementById('med-unit').value = m.unit || "mg";
  document.getElementById('med-format').value = m.format || "Pill";
  document.getElementById('med-hersteller').value = m.hersteller || "";
  document.getElementById('med-einsatzgebiet').value = m.einsatzgebiet || m.generic_name || "";
  state.pendingAdverseEvents = m.adverse_events || "";
  document.getElementById('med-fda-adverse').innerHTML = `<div style="color:var(--accent-color); font-size:11px;">✓ ${m.name} ${t('loggedSuccess')}</div>`;
};
