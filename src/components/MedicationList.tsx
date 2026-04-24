import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { Pill, Droplet, Syringe, Wind, Edit2, Trash2, Plus, Sparkles, Factory, ClipboardList, AlertCircle } from 'lucide-react';
import { API } from '../db';
import { cn } from '../utils/ui';

const formatIcons: Record<string, any> = {
  'Pill': Pill,
  'Liquid': Droplet,
  'Injection': Syringe,
  'Inhaler': Wind
};

import { useAI } from '../hooks/useAI';

const MedicationList: React.FC = () => {
  const { medications, localDrugs, grokKey } = useStore();
  const { t } = useTranslation();
  const { searchMedication } = useAI();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    unit: 'mg',
    format: 'Pill',
    hersteller: '',
    einsatzgebiet: ''
  });

  const handleSave = async () => {
    if (!formData.name || !formData.dose) return alert(t('nameAndDose'));
    
    await API.addMedication({
      ...formData,
      id: editingMed?.id
    });
    
    setShowAddForm(false);
    setEditingMed(null);
    setFormData({ name: '', dose: '', unit: 'mg', format: 'Pill', hersteller: '', einsatzgebiet: '' });
    window.location.reload(); // Temporary
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteMedConfirm'))) {
      await API.deleteMedication(id);
      window.location.reload();
    }
  };

  const handleEdit = (med: any) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dose: med.dose,
      unit: med.unit,
      format: med.format,
      hersteller: med.hersteller || '',
      einsatzgebiet: med.einsatzgebiet || ''
    });
    setShowAddForm(true);
  };

  const [localResults, setLocalResults] = useState<any[]>([]);

  const handleSearchLocal = (query: string) => {
    setFormData({ ...formData, name: query });
    if (query.length < 2) {
      setLocalResults([]);
      return;
    }
    const results = localDrugs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    setLocalResults(results);
  };

  const handleAiSearch = async () => {
    if (!formData.name) return alert(t('nameAndDose'));
    setIsAiSearching(true);
    try {
      const results = await searchMedication(formData.name);
      setAiResults(results);
    } catch (e) {
      alert(t('aiError'));
    } finally {
      setIsAiSearching(false);
    }
  };

  const applyAiMatch = (match: any) => {
    setFormData({
      name: match.name,
      dose: match.default_dose || "",
      unit: match.unit || "mg",
      format: match.format || "Pill",
      hersteller: match.hersteller || "",
      einsatzgebiet: match.einsatzgebiet || match.generic_name || ""
    });
    setAiResults([]);
  };

  const applyLocalDrug = (drug: any) => {
    setFormData({
      name: drug.name,
      dose: drug.default_dose || "",
      unit: drug.unit || "mg",
      format: drug.format || "Pill",
      hersteller: drug.hersteller || "",
      einsatzgebiet: drug.einsatzgebiet || drug.wirkstoff || ""
    });
    setLocalResults([]);
  };

  return (
    <div className="space-y-6">
      {(showAddForm || editingMed) && (
        <div className="glass-panel space-y-4 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold">{editingMed ? t('updateMedication') : t('addMedication')}</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold opacity-50 mb-1 block">{t('nameLbl')}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                  value={formData.name}
                  onChange={(e) => handleSearchLocal(e.target.value)}
                  placeholder="E.g., Aspirin"
                />
                <button 
                  onClick={handleAiSearch}
                  disabled={isAiSearching}
                  className="bg-accent text-black p-3 rounded-xl flex items-center gap-2 font-bold text-xs disabled:opacity-50"
                >
                  <Sparkles size={14} className={isAiSearching ? "animate-spin" : ""} /> {isAiSearching ? "..." : "KI"}
                </button>
              </div>
              {aiResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-bg-dark border border-accent/30 rounded-xl mt-1 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="p-2 text-[9px] font-bold text-accent bg-accent/10 border-b border-accent/20 uppercase tracking-widest">{t('multipleFound')}</div>
                  {aiResults.map((res, i) => (
                    <button 
                      key={i}
                      onClick={() => applyAiMatch(res)}
                      className="w-full text-left p-3 hover:bg-accent/5 border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="font-bold text-accent">{res.name}</div>
                      <div className="text-[10px] opacity-40">{res.generic_name}</div>
                    </button>
                  ))}
                </div>
              )}
              {localResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-bg-dark border border-white/10 rounded-xl mt-1 overflow-y-auto max-h-60 shadow-2xl">
                  {localResults.map(res => (
                    <button 
                      key={res.name}
                      onClick={() => applyLocalDrug(res)}
                      className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                    >
                      <div className="font-bold text-accent">{res.name}</div>
                      <div className="text-[10px] opacity-40">{res.wirkstoff || res.generic_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold opacity-50 mb-1 block">{t('defaultDose')}</label>
                <input 
                  type="text" 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                  value={formData.dose}
                  onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold opacity-50 mb-1 block">{t('unitLbl')}</label>
                <select 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value={t('pillUnit')}>{t('pillUnit')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold opacity-50 mb-1 block">{t('formatLbl')}</label>
              <select 
                className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              >
                <option value="Pill">{t('pillFormat')}</option>
                <option value="Liquid">{t('liquidFormat')}</option>
                <option value="Injection">{t('injectionFormat')}</option>
                <option value="Inhaler">{t('inhalerFormat')}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold opacity-50 mb-1 block">{t('hersteller')}</label>
                <input 
                  type="text" 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-xs"
                  value={formData.hersteller}
                  onChange={(e) => setFormData({ ...formData, hersteller: e.target.value })}
                  placeholder="Pfizer, Bayer..."
                />
              </div>
              <div>
                <label className="text-xs font-bold opacity-50 mb-1 block">{t('einsatzgebiet')}</label>
                <input 
                  type="text" 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-xs"
                  value={formData.einsatzgebiet}
                  onChange={(e) => setFormData({ ...formData, einsatzgebiet: e.target.value })}
                  placeholder="Blutdruck..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={handleSave} 
                disabled={!formData.name || !formData.dose}
                className="btn flex-1 disabled:opacity-30 disabled:grayscale transition-all"
              >
                {t('saveMedication')}
              </button>
              <button onClick={() => { setShowAddForm(false); setEditingMed(null); }} className="btn btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{t('yourMedications')}</h2>
          {!showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-accent text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(74,222,128,0.3)]"
            >
              <Plus size={14} /> {t('medication')}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {medications.length === 0 ? (
            <div className="p-8 text-center text-white/30 italic">{t('noMedsFound')}</div>
          ) : (
            medications.map(med => {
              const Icon = formatIcons[med.format] || Pill;
              return (
                <div key={med.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-width-0">
                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                      <Icon size={24} className="text-accent" />
                    </div>
                    <div className="min-width-0">
                      <div className="font-bold truncate text-sm">{med.name}</div>
                      <div className="text-[10px] opacity-50">
                        {med.dose} {med.unit} • {t(med.format.toLowerCase() + 'Format') || med.format}
                      </div>
                      {med.hersteller && (
                        <div className="flex items-center gap-1 text-[9px] opacity-30 mt-1 uppercase tracking-tighter">
                          <Factory size={10} /> {med.hersteller}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleEdit(med)} 
                      className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(med.id)} 
                      className="w-10 h-10 flex items-center justify-center bg-red-500/5 border border-red-500/10 rounded-xl text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationList;
