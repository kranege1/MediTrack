import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { APP_VERSION, GROK_BASE_URL } from '../constants';
import { API } from '../db';
import { cn } from '../utils/ui';
import { RefreshCw, Download, Upload, Trash2, ShieldAlert, Check, MapPin, AlertCircle, Activity, Search, Server, X, ExternalLink } from 'lucide-react';

interface DiagResult {
  keyOk: boolean;
  modelsCount: number;
  searchOk: boolean;
  latency: number;
  recomModel: string;
}

const SettingsView: React.FC = () => {
  const { grokKey, defaultRegion, grokModel, availableModels, useLiveSearch, setGrokKey, setDefaultRegion, setGrokModel, setUseLiveSearch, setAvailableModels } = useStore();
  const { t } = useTranslation();

  const [localKey, setLocalKey] = useState(grokKey);
  const [localRegion, setLocalRegion] = useState(defaultRegion);
  const [localModel, setLocalModel] = useState(grokModel);
  const [localLive, setLocalLive] = useState(useLiveSearch);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [diag, setDiag] = useState<DiagResult | null>(null);
  const [isDiaging, setIsDiaging] = useState(false);

  // Sync local state if store changes (e.g. after import)
  useEffect(() => {
    setLocalKey(grokKey);
    setLocalRegion(defaultRegion);
    setLocalModel(grokModel);
    setLocalLive(useLiveSearch);
  }, [grokKey, defaultRegion, grokModel, useLiveSearch]);

  const runDiagnostics = async (key: string, model: string, live: boolean) => {
    setIsDiaging(true);
    const start = Date.now();
    const result: DiagResult = { keyOk: false, modelsCount: 0, searchOk: false, latency: 0, recomModel: '' };
    
    try {
      // 1. Key & Models test
      const resModels = await fetch('https://api.x.ai/v1/models', {
        headers: { "Authorization": `Bearer ${key}` }
      });
      if (resModels.ok) {
        result.keyOk = true;
        const data = await resModels.json();
        const modelsArray = data.data || data.models || [];
        result.modelsCount = modelsArray.length;
        const ids = modelsArray.map((m: any) => m.id);
        setAvailableModels(ids);
        result.recomModel = ids.includes('grok-2-1212') ? 'grok-2-1212' : (ids.includes('grok-beta') ? 'grok-beta' : (ids[0] || 'grok-2-1212'));
      }

      // 2. Web Search Test (if enabled)
      if (live && result.keyOk) {
        try {
          const resSearch = await fetch(GROK_BASE_URL, {
            method: 'POST',
            headers: { 
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: 'OK' }],
              web_search: true
            })
          });
          result.searchOk = resSearch.ok;
        } catch (se) {
          result.searchOk = false;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      result.latency = Date.now() - start;
      setDiag(result);
      setIsDiaging(false);
    }
  };

  const handleSave = () => {
    const trimmedKey = (localKey || '').trim();
    const trimmedRegion = (localRegion || '').trim();
    
    setGrokKey(trimmedKey);
    setDefaultRegion(trimmedRegion);
    setGrokModel(localModel || 'grok-2-1212');
    setUseLiveSearch(!!localLive);
    
    setLocalKey(trimmedKey);
    setLocalRegion(trimmedRegion);
    
    setIsSaved(true);
    runDiagnostics(trimmedKey, localModel, localLive);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const validateKey = async (key: string) => {
    if (!key) { setKeyStatus('idle'); return; }
    setKeyStatus('checking');
    try {
      const res = await fetch('https://api.x.ai/v1/models', {
        headers: { "Authorization": `Bearer ${key}` }
      });
      if (res.ok) {
        setKeyStatus('valid');
        const data = await res.json();
        const modelsArray = data.data || data.models || [];
        const models = modelsArray.map((m: any) => m.id);
        setAvailableModels(models);
        if (!localModel || !models.includes(localModel)) setLocalModel(models[0]);
      } else {
        setKeyStatus('invalid');
      }
    } catch (e) {
      setKeyStatus('invalid');
    }
  };

  useEffect(() => {
    if (grokKey) validateKey(grokKey);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKey && localKey !== grokKey) validateKey(localKey);
    }, 1000);
    return () => clearTimeout(timer);
  }, [localKey]);

  const handleLocate = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        const { postcode, city, town, village, country } = data.address;
        const place = city || town || village || "";
        const fullLocation = `${postcode || ""} ${place}, ${country || ""}`.trim().replace(/^, /, "");
        setLocalRegion(fullLocation);
      } catch (e) {
        alert(t('locErr'));
      } finally {
        setIsLocating(false);
      }
    }, () => {
      setIsLocating(false);
      alert(t('locErr'));
    });
  };

  const handleImport = async () => {
    if (!selectedFile) return alert(t('selectFile'));
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await API.importData(json);
        const data = JSON.parse(json);
        if (data.settings) {
          setGrokKey(data.settings.grokKey);
          setDefaultRegion(data.settings.defaultRegion);
          setGrokModel(data.settings.grokModel);
        }
        alert(t('restoredSuccess'));
        window.location.reload();
      } catch (err) {
        alert(t('importError'));
      }
    };
    reader.readAsText(selectedFile);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="glass-panel space-y-6">
        <h2 className="text-lg font-bold">{t('settings')}</h2>
        
        <div className="space-y-4">
          <div className="form-group relative">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('enteringApiKey')}</label>
            <div className="relative">
              <input 
                type="password" 
                className="bg-white/5 border border-white/10 rounded-xl p-3 w-full pr-10"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="xai-..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {keyStatus === 'checking' && <RefreshCw size={18} className="animate-spin text-white/40" />}
                {keyStatus === 'valid' && <Check size={18} className="text-accent" />}
                {keyStatus === 'invalid' && <AlertCircle size={18} className="text-red-400" />}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('defaultRegionLabel')}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex-1"
                value={localRegion}
                onChange={(e) => setLocalRegion(e.target.value)}
                placeholder={t('regionPlaceholder')}
              />
              <button 
                onClick={handleLocate}
                disabled={isLocating}
                className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <MapPin size={18} className={isLocating ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('modelIdLabel')}</label>
            <div className="flex gap-2">
              <select 
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex-1"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
              >
                {Array.isArray(availableModels) && availableModels.length > 0 ? (
                  availableModels.map(m => <option key={m} value={m}>{m}</option>)
                ) : (
                  <option value={localModel}>{localModel || "grok-2-1212"}</option>
                )}
                <option value="custom">{t('customModel')}</option>
              </select>
              <button onClick={() => validateKey(localKey)} className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors">
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

          <button 
            onClick={handleSave} 
            className={cn("btn flex items-center justify-center gap-2 transition-all", isSaved ? "bg-accent text-black scale-105" : "")}
          >
            {isSaved ? <><Check size={18} /> {t('settingsSavedLabel')}</> : <><Check size={18} /> {t('saveSettingsBtn')}</>}
          </button>
        </div>
      </div>

      {diag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm border-accent/20 bg-black/80 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={20} className="text-accent" />
              <h3 className="text-lg font-bold">{t('diagTitle')}</h3>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <Server size={16} className={diag?.keyOk ? "text-accent" : "text-red-400"} />
                <span className={diag?.keyOk ? "" : "text-red-400"}>{t('diagKeyOk')}</span>
                {diag?.keyOk && <Check size={14} className="text-accent ml-auto" />}
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Activity size={16} className={diag?.modelsCount === 0 ? "text-red-400" : "text-accent"} />
                <span className={diag?.modelsCount === 0 ? "text-red-400 font-bold" : ""}>{t('diagModelsFound').replace('{n}', String(diag?.modelsCount || 0))}</span>
              </div>
              
              {diag?.keyOk && diag?.modelsCount === 0 && (
                <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-[10px] text-red-300 animate-pulse">
                  {t('diagNoModelsTip')}
                </div>
              )}

              {localLive && (
                <div className="flex items-center gap-3 text-sm">
                  <Search size={16} className={diag?.searchOk ? "text-accent" : "text-red-400"} />
                  <span className={diag?.searchOk ? "" : "text-red-400"}>{diag?.searchOk ? t('diagSearchOk') : t('diagSearchErr')}</span>
                  {diag?.searchOk && <Check size={14} className="text-accent ml-auto" />}
                </div>
              )}

              <div className="pt-4 border-t border-white/5 mt-4 space-y-1">
                <div className="text-xs opacity-40">{t('diagSpeed').replace('{n}', String(diag.latency))}</div>
                <div className="text-xs text-accent/60 italic">{t('diagModelRec').replace('{m}', diag.recomModel)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setDiag(null)}
                className="btn w-full py-4 text-base"
              >
                OK
              </button>
              <a 
                href="https://console.x.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2 border-white/5 bg-white/5"
              >
                <ExternalLink size={14} /> {t('diagConsoleBtn')}
              </a>
            </div>
          </div>
        </div>
      )}

      {isDiaging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw size={40} className="animate-spin text-accent" />
            <div className="text-sm font-bold tracking-widest uppercase opacity-60">{t('diagTesting')}</div>
          </div>
        </div>
      )}

      <div className="glass-panel space-y-6">
        <h2 className="text-lg font-bold">{t('dataManagement')}</h2>
        <p className="text-xs opacity-50 leading-relaxed">{t('dataNote')}</p>
        
        <div className="grid grid-cols-1 gap-3">
          <button onClick={handleExport} className="btn btn-secondary justify-start py-4">
            <Download size={18} className="text-accent" /> {t('exportData')}
          </button>
          <button onClick={() => { if(confirm(t('confirmDeleteLogs'))) API.clearLogs().then(() => window.location.reload()) }} className="btn btn-secondary justify-start py-4 border-orange-500/20 text-orange-400 bg-orange-500/5">
            <Trash2 size={18} /> {t('deleteLogs')}
          </button>
          <button onClick={() => { if(confirm(t('confirmDeleteAll'))) { API.clearAllData(); localStorage.clear(); window.location.reload(); } }} className="btn btn-secondary justify-start py-4 border-red-500/20 text-red-400 bg-red-500/5">
            <ShieldAlert size={18} /> {t('deleteAllData')}
          </button>
        </div>

        <div className="pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold mb-4">{t('restoreData')}</h3>
          <div className="space-y-4">
            <input 
              type="file" 
              accept=".json" 
              className="text-xs opacity-60 w-full"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button onClick={handleImport} className="btn btn-secondary"><Upload size={18} /> {t('importRestore')}</button>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(true); }}
            className="w-full py-3 text-[10px] font-bold opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest"
          >
            {t('forceUpdateBtn')}
          </button>
        </div>
      </div>

      <div className="text-center opacity-20 text-[10px] py-4">
        MedicaTrack v{APP_VERSION} • {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default SettingsView;
