import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { Pill, Activity, Trash2, List, BarChart3, Clock } from 'lucide-react';
import { API } from '../db';
import { cn } from '../utils/ui';

const HistoryView: React.FC = () => {
  const { logs, metrics, medications, setData } = useStore();
  const { t, lang } = useTranslation();
  const [subView, setSubView] = useState<'list' | 'charts'>('list');

  const historyStream = [
    ...logs.map(l => ({ ...l, type: 'log' })),
    ...metrics.map(m => ({ ...m, type: 'metric', metricType: m.type }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleDelete = async (id: string, type: string) => {
    if (confirm(t('deleteMedConfirm'))) {
      if (type === 'metric') await API.deleteMetric(id);
      else await API.deleteLog(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button 
          onClick={() => setSubView('list')}
          className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", subView === 'list' ? "bg-accent text-black shadow-lg" : "text-white/40")}
        >
          {t('list')}
        </button>
        <button 
          onClick={() => setSubView('charts')}
          className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", subView === 'charts' ? "bg-accent text-black shadow-lg" : "text-white/40")}
        >
          {t('charts')}
        </button>
      </div>

      {subView === 'list' ? (
        <div className="glass-panel">
          <h2 className="text-lg font-bold mb-6">{t('history')}</h2>
          <div className="space-y-3">
            {historyStream.length === 0 ? (
              <div className="p-8 text-center text-white/30 italic">{t('noLogsToday')}</div>
            ) : (
              historyStream.map((item: any) => {
                const isMetric = item.type === 'metric';
                const date = new Date(item.timestamp);
                const med = !isMetric ? medications.find(m => m.id === item.medicationId) : null;
                
                return (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-width-0">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">
                        {isMetric ? <Activity size={20} className="text-blue-400" /> : <Pill size={20} className="text-accent" />}
                      </div>
                      <div className="min-width-0">
                        <div className="text-[10px] opacity-30 flex items-center gap-1">
                          <Clock size={10} /> {date.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })} • {date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="font-bold text-sm truncate">
                          {isMetric ? t(item.metricType) : med?.name || item.medName || t('unknown')}
                        </div>
                        <div className="text-[11px] opacity-50">
                          {isMetric ? item.value : `${item.amount_taken} ${med?.unit || t('units')}`}
                        </div>
                      </div>
                    </div>

                    <button onClick={() => handleDelete(item.id, item.type)} className="w-9 h-9 flex items-center justify-center bg-red-500/5 border border-red-500/20 rounded-lg text-red-400/40 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel">
            <h2 className="text-lg font-bold mb-4">{t('adherence')}</h2>
            <div id="adherence-chart" className="min-h-[200px] flex items-center justify-center text-white/20 italic">
              Chart implementation in progress...
            </div>
          </div>
          <div className="glass-panel">
            <h2 className="text-lg font-bold mb-4">{t('trends')}</h2>
            <div id="weight-chart" className="min-h-[200px] flex items-center justify-center text-white/20 italic">
              Chart implementation in progress...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
