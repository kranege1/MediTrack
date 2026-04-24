import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { isPlanDueOnDate } from '../utils/date';
import { Check, X, Calendar, Plus, Clock } from 'lucide-react';
import { API } from '../db';
import { generateICS } from '../utils/calendar';

const Dashboard: React.FC = () => {
  const { plans, logs, medications, setNavigate } = useStore();
  const { t, lang } = useTranslation();

  const handleConfirm = async (planId: string, dateISO: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    await API.addLog({
      medicationId: plan.medicationId,
      planId: plan.id,
      plannedDate: dateISO,
      status: 'taken',
      amount_taken: plan.dose,
    });
    // The useDataLoader hook or store needs to refresh data here
    // For now, let's assume we have a refresh function
    window.location.reload(); // Temporary till we have better state refresh
  };

  const handleSkip = async (planId: string, dateISO: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    await API.addLog({
      medicationId: plan.medicationId,
      planId: plan.id,
      plannedDate: dateISO,
      status: 'skipped',
      amount_taken: 0,
    });
    window.location.reload();
  };
  
  const handleCalendarExport = (plan: any, dateISO: string) => {
    const isAppt = plan.type === 'appointment';
    const med = !isAppt ? medications.find(m => m.id === plan.medicationId) : null;
    
    const title = isAppt ? `${t('appointment')}: ${plan.doctorName}` : `${t('logAction')}: ${med?.name || t('unknown')}`;
    const time = isAppt ? plan.startTime : (plan.timeCategory === 'morning' ? '08:00' : plan.timeCategory === 'noon' ? '12:00' : '18:00');
    
    generateICS(title, dateISO, time, plan.location || '', plan.note || '');
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    targetDate.setHours(0, 0, 0, 0);
    
    const duePlans = plans.filter(p => isPlanDueOnDate(p, targetDate));
    const targetDateISO = targetDate.toISOString().split('T')[0];
    
    const dayLogs = logs.filter(l => {
      const d = new Date(l.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === targetDate.getTime();
    });

    if (duePlans.length > 0) {
      forecast.push({ date: targetDate, plans: duePlans, logs: dayLogs, iso: targetDateISO });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-accent">●</span> {t('dueToday')}
          </h2>
        </div>

        {forecast.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/40 italic">
            {t('noUpcoming')}
          </div>
        ) : (
          <div className="space-y-6">
            {forecast.map((day, idx) => (
              <div key={day.iso} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {idx === 0 ? t('today') : idx === 1 ? t('tomorrow') : day.date.toLocaleDateString(lang, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </span>
                  {idx === 0 && (
                    <button 
                      onClick={() => setNavigate('log')}
                      className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg border border-accent/20"
                    >
                      + {t('adHoc')}
                    </button>
                  )}
                </div>
                
                {day.plans.map(plan => {
                  const isAppt = plan.type === 'appointment';
                  const med = !isAppt ? medications.find(m => m.id === plan.medicationId) : null;
                  const logEntry = day.logs.find(l => l.planId === plan.id && l.plannedDate === day.iso);
                  const isCompleted = logEntry?.status === 'taken';
                  const isSkipped = logEntry?.status === 'skipped';

                  return (
                    <div 
                      key={plan.id}
                      className={`glass-panel flex items-center justify-between gap-4 p-4 transition-all ${isCompleted || isSkipped ? 'opacity-50 grayscale' : ''}`}
                      style={{ borderLeft: `4px solid ${isCompleted ? '#4ade80' : isSkipped ? '#ef4444' : isAppt ? '#8b5cf6' : idx === 0 ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }}
                    >
                      <div className="flex-1 min-width-0">
                        <div className="font-bold text-sm truncate">
                          {isAppt ? `🏥 ${plan.doctorName}` : med?.name || t('unknown')}
                        </div>
                        <div className="text-[11px] text-white/50">
                          {isAppt 
                            ? (plan.location ? `📍 ${plan.location}` : t('appointment'))
                            : `${t(plan.timeCategory || 'morning')} | ${plan.dose} ${med?.unit || t('units')}`
                          }
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {idx === 0 && !isCompleted && !isAppt && (
                          <>
                            <button 
                              onClick={() => handleConfirm(plan.id, day.iso)}
                              className="w-10 h-10 flex items-center justify-center bg-accent/10 text-accent border border-accent/20 rounded-xl active:scale-90 transition-transform"
                            >
                              <Check size={20} />
                            </button>
                            <button 
                              onClick={() => handleSkip(plan.id, day.iso)}
                              className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl active:scale-90 transition-transform"
                            >
                              <X size={20} />
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <div className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-1 rounded-lg">
                            {t('completed')}
                          </div>
                        )}
                        {isSkipped && (
                          <div className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg">
                            {t('skipped')}
                          </div>
                        )}
                        <button 
                          onClick={() => handleCalendarExport(plan, day.iso)}
                          className="w-8 h-8 flex items-center justify-center bg-white/5 text-white/30 border border-white/10 rounded-lg hover:text-accent hover:border-accent/50 transition-colors"
                        >
                          <Calendar size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pt-4 border-t border-white/5">
        <h2 className="text-sm font-bold flex items-center gap-2 opacity-60 mb-4">
          <Clock size={16} /> {t('recentActivity')}
        </h2>
        <div className="space-y-2">
          {logs.slice(0, 5).reverse().map(log => {
            const med = medications.find(m => m.id === log.medicationId);
            return (
              <div key={log.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
                <span className="font-medium">{med?.name || log.medName || t('unknown')} <span className="opacity-40 font-normal">({log.amount_taken})</span></span>
                <span className="opacity-40">{new Date(log.timestamp).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-[11px] opacity-30 text-center py-4 italic">{t('noLogsToday')}</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
