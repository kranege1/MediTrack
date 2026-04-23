import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { Pill, UserCircle, Trash2, Plus, Search, MapPin, Clock, Calendar } from 'lucide-react';
import { API } from '../db';
import { cn } from '../utils/ui';

const PlanManager: React.FC = () => {
  const { plans, medications, planType, setData, defaultRegion, localDoctors } = useStore();
  const { t, lang } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form States
  const [medPlan, setMedPlan] = useState({
    medicationId: '',
    timeCategory: 'morning',
    dose: '',
    startDate: new Date().toISOString().slice(0, 10),
    frequency: 'daily',
    startWeekday: '1',
    startDayOfMonth: '1',
    isOneTime: false
  });

  const [apptPlan, setApptPlan] = useState({
    doctorName: '',
    location: defaultRegion || '',
    specialty: '',
    phone: '',
    note: '',
    date: new Date().toISOString().slice(0, 16)
  });

  const [doctorResults, setDoctorResults] = useState<any[]>([]);

  const handleSave = async () => {
    if (planType === 'appointment') {
      if (!apptPlan.doctorName || !apptPlan.date) return alert(t('nameAndDose'));
      await API.addPlan({
        type: 'appointment',
        ...apptPlan,
        startDate: apptPlan.date.split('T')[0],
        startTime: apptPlan.date.split('T')[1],
        isOneTime: true
      });
    } else {
      if (!medPlan.medicationId || !medPlan.dose || !medPlan.startDate) return alert(t('medAndTime'));
      await API.addPlan({
        ...medPlan
      });
    }
    setShowAddForm(false);
    window.location.reload();
  };

  const handleRemove = async (id: string) => {
    if (confirm(t('removeScheduleConfirm'))) {
      await API.deletePlan(id);
      window.location.reload();
    }
  };

  const handleDoctorSearch = (query: string) => {
    setApptPlan({ ...apptPlan, doctorName: query });
    if (query.length < 2) {
      setDoctorResults([]);
      return;
    }
    const results = localDoctors.filter(d => 
      d.name.toLowerCase().includes(query.toLowerCase()) || 
      d.specialty.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    setDoctorResults(results);
  };

  const applyLocalDoctor = (doc: any) => {
    setApptPlan({
      ...apptPlan,
      doctorName: doc.name,
      specialty: doc.specialty,
      location: doc.address || doc.ort,
      phone: doc.phone || doc.telefon || ""
    });
    setDoctorResults([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button 
          onClick={() => setData('planType', 'medication')}
          className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", planType === 'medication' ? "bg-accent text-black shadow-lg" : "text-white/40")}
        >
          {t('medication')}
        </button>
        <button 
          onClick={() => setData('planType', 'appointment')}
          className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", planType === 'appointment' ? "bg-accent text-black shadow-lg" : "text-white/40")}
        >
          {t('appointment')}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel space-y-4 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold">{planType === 'appointment' ? t('appointment') : t('createSchedule')}</h2>
          
          {planType === 'medication' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="med-select" className="text-xs font-bold opacity-50 mb-1 block">{t('selectMed')}</label>
                <select 
                  id="med-select"
                  className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                  value={medPlan.medicationId}
                  onChange={(e) => setMedPlan({ ...medPlan, medicationId: e.target.value })}
                >
                  <option value="">{t('chooseOption')}</option>
                  {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="time-select" className="text-xs font-bold opacity-50 mb-1 block">{t('timeOfDay')}</label>
                  <select 
                    id="time-select"
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={medPlan.timeCategory}
                    onChange={(e) => setMedPlan({ ...medPlan, timeCategory: e.target.value })}
                  >
                    <option value="morning">{t('morning')}</option>
                    <option value="noon">{t('noon')}</option>
                    <option value="evening">{t('evening')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dose-input" className="text-xs font-bold opacity-50 mb-1 block">{t('dose')}</label>
                  <input 
                    id="dose-input"
                    type="text" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={medPlan.dose}
                    onChange={(e) => setMedPlan({ ...medPlan, dose: e.target.value })}
                    placeholder="e.g. 1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold opacity-50 mb-1 block">{t('anchorDate')}</label>
                  <input 
                    type="date" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={medPlan.startDate}
                    onChange={(e) => setMedPlan({ ...medPlan, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-50 mb-1 block">{t('frequency')}</label>
                  <select 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={medPlan.isOneTime ? 'once' : medPlan.frequency}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'once') setMedPlan({ ...medPlan, isOneTime: true, frequency: 'daily' });
                      else setMedPlan({ ...medPlan, isOneTime: false, frequency: val });
                    }}
                  >
                    <option value="once">{t('oneTime')}</option>
                    <option value="daily">{t('daily')}</option>
                    <option value="weekly">{t('weekly')}</option>
                    <option value="monthly">{t('monthly')}</option>
                  </select>
                </div>
              </div>

              {medPlan.frequency === 'weekly' && !medPlan.isOneTime && (
                <div className="animate-in fade-in duration-300">
                  <label className="text-xs font-bold opacity-50 mb-1 block">{t('startWeekday')}</label>
                  <select 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={medPlan.startWeekday}
                    onChange={(e) => setMedPlan({ ...medPlan, startWeekday: e.target.value })}
                  >
                    <option value="1">{t('monday')}</option>
                    <option value="2">{t('tuesday')}</option>
                    <option value="3">{t('wednesday')}</option>
                    <option value="4">{t('thursday')}</option>
                    <option value="5">{t('friday')}</option>
                    <option value="6">{t('saturday')}</option>
                    <option value="0">{t('sunday')}</option>
                  </select>
                </div>
              )}

              {medPlan.frequency === 'monthly' && !medPlan.isOneTime && (
                <div className="animate-in fade-in duration-300">
                  <label className="text-xs font-bold opacity-50 mb-1 block">{t('startDayOfMonth')}</label>
                  <input 
                    type="number" 
                    min="1" max="31"
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={medPlan.startDayOfMonth}
                    onChange={(e) => setMedPlan({ ...medPlan, startDayOfMonth: e.target.value })}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold opacity-50 mb-1 block">{t('doctorName')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={apptPlan.doctorName}
                    onChange={(e) => handleDoctorSearch(e.target.value)}
                    placeholder="Dr. Smith"
                  />
                  <button className="bg-accent text-black p-3 rounded-xl"><Search size={16} /></button>
                </div>
                {doctorResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-bg-dark border border-white/10 rounded-xl mt-1 overflow-hidden shadow-2xl">
                    {doctorResults.map(doc => (
                      <button 
                        key={doc.name}
                        onClick={() => applyLocalDoctor(doc)}
                        className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                      >
                        <div className="font-bold text-accent">{doc.name}</div>
                        <div className="text-[10px] opacity-40">{doc.specialty} • {doc.address || doc.ort}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold opacity-50 mb-1 block">{t('specialty')}</label>
                  <select 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-xs"
                    value={apptPlan.specialty}
                    onChange={(e) => setApptPlan({ ...apptPlan, specialty: e.target.value })}
                  >
                    <option value="">{t('anySpecialty')}</option>
                    {(t('specialties') as string[]).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold opacity-50 mb-1 block">{t('logDateTime')}</label>
                  <input 
                    type="datetime-local" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-xs"
                    value={apptPlan.date}
                    onChange={(e) => setApptPlan({ ...apptPlan, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold opacity-50 mb-1 block">{t('location')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
                    value={apptPlan.location}
                    onChange={(e) => setApptPlan({ ...apptPlan, location: e.target.value })}
                    placeholder="City"
                  />
                  <button className="bg-white/5 border border-white/10 p-3 rounded-xl"><MapPin size={16} /></button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button onClick={handleSave} className="btn flex-1">{t('savePlan')}</button>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary flex-1">{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{t('plans')}</h2>
          {!showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-accent text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(74,222,128,0.3)]"
            >
              <Plus size={14} /> {t('newPlan')}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="p-8 text-center text-white/30 italic">{t('noSchedule')}</div>
          ) : (
            plans.map(plan => {
              const isAppt = plan.type === 'appointment';
              const med = !isAppt ? medications.find(m => m.id === plan.medicationId) : null;
              return (
                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-width-0">
                    <div className="w-11 h-11 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shadow-inner">
                      {isAppt ? <UserCircle size={24} className="text-purple-400" /> : <Pill size={24} className="text-accent" />}
                    </div>
                    <div className="min-width-0">
                      <div className="font-bold truncate text-sm">{isAppt ? plan.doctorName : med?.name || t('unknown')}</div>
                      <div className="text-[10px] opacity-50 flex items-center gap-2">
                        {isAppt ? (
                          <>
                            <MapPin size={10} /> {plan.location}
                            <Clock size={10} className="ml-2" /> {plan.startTime}
                          </>
                        ) : (
                          <>
                            <Clock size={10} /> {t(plan.timeCategory || 'morning')}
                            <div className="w-1 h-1 bg-white/20 rounded-full" />
                            {plan.dose} {med?.unit || t('units')}
                            {!plan.isOneTime && plan.frequency !== 'daily' && (
                              <>
                                <div className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-accent/60 uppercase">{t(plan.frequency)}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => handleRemove(plan.id)} className="w-9 h-9 flex items-center justify-center bg-red-500/5 border border-red-500/20 rounded-lg text-red-400/40 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanManager;
