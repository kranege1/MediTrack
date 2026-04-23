import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { APP_VERSION } from '../constants';
import { API } from '../db';
import { RefreshCw, Download, Upload, Trash2, ShieldAlert, Check } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { grokKey, defaultRegion, grokModel, availableModels, useLiveSearch, setGrokKey, setDefaultRegion, setGrokModel, setUseLiveSearch, setAvailableModels } = useStore();
  const { t } = useTranslation();

  const [localKey, setLocalKey] = useState(grokKey);
  const [localRegion, setLocalRegion] = useState(defaultRegion);
  const [localModel, setLocalModel] = useState(grokModel);
  const [localLive, setLocalLive] = useState(useLiveSearch);

  const handleSave = () => {
    setGrokKey(localKey);
    setDefaultRegion(localRegion);
    setGrokModel(localModel);
    setUseLiveSearch(localLive);
    alert(t('settingsSavedLabel'));
  };

  const handleExport = async () => {
    const data = {
      medications: await API.getMedications(),
      logs: await API.getLogs(),
      metrics: await API.getMetrics(),
      plans: await API.getPlans(),
      settings: { grokKey, defaultRegion, grokModel, useLiveSearch },
      version: APP_VERSION,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MedicaTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleClearLogs = async () => {
    if (confirm(t('confirmDeleteLogs'))) {
      await API.clearLogs();
      window.location.reload();
    }
  };

  const handleDeleteAll = async () => {
    if (confirm(t('confirmDeleteAll'))) {
      await API.clearAllData();
      localStorage.clear();
      window.location.reload();
    }
  };

  const fetchModels = async () => {
    if (!localKey) return alert(t('missingKeyError'));
    try {
      const res = await fetch('https://api.x.ai/v1/models', {
        headers: { "Authorization": `Bearer ${localKey}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const models = data.models.map((m: any) => m.id);
      setAvailableModels(models);
    } catch (err) {
      alert(t('lookupFailed'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="glass-panel space-y-6">
        <h2 className="text-lg font-bold">{t('settings')}</h2>
        
        <div className="space-y-4">
          <div className="form-group">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('enteringApiKey')}</label>
            <input 
              type="password" 
              className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="xai-..."
            />
          </div>

          <div className="form-group">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('defaultRegionLabel')}</label>
            <input 
              type="text" 
              className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
              value={localRegion}
              onChange={(e) => setLocalRegion(e.target.value)}
              placeholder={t('regionPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('modelIdLabel')}</label>
            <div className="flex gap-2">
              {availableModels.length > 0 ? (
                <select 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 flex-1"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                >
                  {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="custom">{t('customModel')}</option>
                </select>
              ) : (
                <input 
                  type="text" 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 flex-1"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                />
              )}
              <button onClick={fetchModels} className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-accent"
              checked={localLive}
              onChange={(e) => setLocalLive(e.target.checked)}
            />
            <div>
              <div className="text-sm font-bold">{t('liveSearchLabel')}</div>
              <div className="text-[10px] opacity-40">{t('liveSearchSub')}</div>
            </div>
          </label>

          <button onClick={handleSave} className="btn">
            <Check size={18} /> {t('saveSettingsBtn')}
          </button>
        </div>
      </div>

      <div className="glass-panel space-y-6">
        <h2 className="text-lg font-bold">{t('dataManagement')}</h2>
        <p className="text-xs opacity-50 leading-relaxed">{t('dataNote')}</p>
        
        <div className="grid grid-cols-1 gap-3">
          <button onClick={handleExport} className="btn btn-secondary justify-start py-4">
            <Download size={18} className="text-accent" /> {t('exportData')}
          </button>
          <button onClick={handleClearLogs} className="btn btn-secondary justify-start py-4 border-orange-500/20 text-orange-400 bg-orange-500/5">
            <Trash2 size={18} /> {t('deleteLogs')}
          </button>
          <button onClick={handleDeleteAll} className="btn btn-secondary justify-start py-4 border-red-500/20 text-red-400 bg-red-500/5">
            <ShieldAlert size={18} /> {t('deleteAllData')}
          </button>
        </div>

        <div className="pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold mb-4">{t('restoreData')}</h3>
          <div className="space-y-4">
            <input type="file" accept=".json" className="text-xs opacity-60 w-full" />
            <button className="btn btn-secondary"><Upload size={18} /> {t('importRestore')}</button>
          </div>
        </div>
      </div>

      <div className="text-center opacity-20 text-[10px] py-4">
        MedicaTrack v{APP_VERSION} • {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default SettingsView;
