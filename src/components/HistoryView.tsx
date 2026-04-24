import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { Pill, Activity, Trash2, List, Clock, TrendingUp, Heart } from 'lucide-react';
import { API } from '../db';
import { cn } from '../utils/ui';

const HistoryView: React.FC = () => {
  const { logs, metrics, medications, plans } = useStore();
  const { t, lang } = useTranslation();
  const [subView, setSubView] = useState<'list' | 'charts'>('list');

  const historyStream = [
    ...logs.map(l => ({ ...l, type: 'log' })),
    ...metrics.map(m => ({ ...m, type: 'metric', metricType: m.type }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  useEffect(() => {
    if (subView !== 'charts' || typeof (window as any).ApexCharts === 'undefined') return;

    const commonOptions = {
      chart: {
        height: 180,
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
        sparkline: { enabled: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      theme: { mode: 'dark' },
      grid: { borderColor: 'rgba(255,255,255,0.05)', padding: { left: 10, right: 10 } },
      xaxis: {
        labels: { style: { colors: '#64748b', fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: { labels: { style: { colors: '#64748b', fontSize: '10px' } } }
    };

    // 1. Weight Chart
    const weightData = metrics
      .filter(m => m.type === 'bodyWeight')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7);

    const wChart = new (window as any).ApexCharts(document.querySelector("#weight-chart"), {
      ...commonOptions,
      series: [{ name: t('weight'), data: weightData.map(m => parseFloat(m.value)) }],
      colors: ['#4ade80'],
      xaxis: {
        ...commonOptions.xaxis,
        categories: weightData.map(m => new Date(m.timestamp).toLocaleDateString(lang, { day: '2-digit', month: '2-digit' }))
      }
    });
    wChart.render();

    // 2. Heart Rate Chart
    const heartData = metrics
      .filter(m => m.type === 'heartRate')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7);

    const hChart = new (window as any).ApexCharts(document.querySelector("#pulse-chart"), {
      ...commonOptions,
      series: [{ name: 'BPM', data: heartData.map(m => parseFloat(m.value)) }],
      colors: ['#f87171'],
      xaxis: {
        ...commonOptions.xaxis,
        categories: heartData.map(m => new Date(m.timestamp).toLocaleDateString(lang, { day: '2-digit', month: '2-digit' }))
      }
    });
    hChart.render();

    // 3. Adherence Calculation (Last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(l => l.timestamp > sevenDaysAgo && l.status === 'taken').length;
    const adherenceValue = plans.length > 0 ? Math.min(100, Math.round((recentLogs / (plans.length * 7)) * 100)) : 100;

    const aChart = new (window as any).ApexCharts(document.querySelector("#adherence-chart"), {
      series: [adherenceValue],
      chart: { height: 200, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { size: '70%' },
          track: { background: 'rgba(255,255,255,0.05)', strokeWidth: '97%' },
          dataLabels: {
            name: { show: false },
            value: { offsetY: 10, color: '#4ade80', fontSize: '24px', fontWeight: 'bold', show: true }
          }
        }
      },
      colors: ['#4ade80'],
      stroke: { lineCap: 'round' },
      labels: ['Adherence'],
    });
    aChart.render();

    return () => {
      wChart.destroy();
      hChart.destroy();
      aChart.destroy();
    };
  }, [subView, metrics, logs, plans, t, lang]);

  const handleDelete = async (id: string, type: string) => {
    if (confirm(t('deleteMedConfirm'))) {
      if (type === 'metric') await API.deleteMetric(id);
      else await API.deleteLog(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
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
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <List size={20} className="text-accent" /> {t('history')}
          </h2>
          <div className="space-y-3">
            {historyStream.length === 0 ? (
              <div className="p-12 text-center">
                <Clock size={40} className="mx-auto mb-4 opacity-10" />
                <div className="text-white/30 italic">{t('noLogsToday')}</div>
              </div>
            ) : (
              historyStream.map((item: any) => {
                const isMetric = item.type === 'metric';
                const date = new Date(item.timestamp);
                const med = !isMetric ? medications.find(m => m.id === item.medicationId) : null;
                
                return (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0", isMetric ? "bg-blue-500/10" : "bg-accent/10")}>
                        {isMetric ? <Activity size={20} className="text-blue-400" /> : <Pill size={20} className="text-accent" />}
                      </div>
                      <div className="overflow-hidden">
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

                    <button onClick={() => handleDelete(item.id, item.type)} className="w-9 h-9 flex items-center justify-center bg-red-500/5 border border-red-500/20 rounded-lg text-red-400/40 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel text-center">
            <h2 className="text-sm font-bold opacity-50 mb-2 uppercase tracking-widest">{t('adherence')}</h2>
            <div id="adherence-chart" className="flex justify-center -mb-6" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="glass-panel">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-50">{t('weight')}</h2>
              </div>
              <div id="weight-chart" className="w-full" />
            </div>

            <div className="glass-panel">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} className="text-red-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-50">Pulse (BPM)</h2>
              </div>
              <div id="pulse-chart" className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
