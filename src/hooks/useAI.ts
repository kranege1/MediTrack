import { useStore } from '../store/useStore';
import { GROK_BASE_URL } from '../constants';

export function useAI() {
  const { grokKey, grokModel, lang } = useStore();

  const searchMedication = async (query: string) => {
    if (!grokKey) throw new Error('Missing API Key');

    const promptText = `Identifiziere die wichtigsten Medikamente mit dem Namen oder einem ähnlichen Brand wie "${query}". 
    Return as JSON array of objects in a "results" field.
    Structure: {"results": [{"name": "...", "generic_name": "...", "default_dose": "...", "unit": "...", "format": "...", "adverse_events": "..."}]}
    Language: ${lang === 'de' ? 'German' : 'English'}.
    ONLY valid JSON.`;

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${grokKey}` },
      body: JSON.stringify({
        model: grokModel,
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result.results || [];
  };

  const searchDoctor = async (name: string, specialty: string, region: string, useLiveSearch: boolean) => {
    if (!grokKey) throw new Error('Missing API Key');

    const regionText = region ? ` in "${region}"` : '';
    const nameText = name ? (specialty ? `named "${name}" specializing in "${specialty}"` : `named "${name}"`) : `specializing in "${specialty}"`;
    const prompt = `Find professional contact details for: ${nameText}${regionText}. Return ONLY JSON: {"doctors": [{"name": "...", "specialty": "...", "address": "...", "phone": "..."}]}. Language: ${lang === 'de' ? 'German' : 'English'}.`;

    const body: any = { 
      model: grokModel, 
      messages: [{ role: "user", content: prompt }], 
      temperature: 0 
    };
    
    if (useLiveSearch) body.tools = [{ type: "web_search" }];
    else body.response_format = { type: "json_object" };

    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${grokKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(res.statusText);
    const d = await res.json();
    let content = d.choices[0].message.content || "";
    
    if (content.includes('```json')) content = content.split('```json')[1].split('```')[0].trim();
    else if (content.includes('{')) content = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);

    const data = JSON.parse(content);
    return data.doctors || [];
  };

  return { searchMedication, searchDoctor };
}
