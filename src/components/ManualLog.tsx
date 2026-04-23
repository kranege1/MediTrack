import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { Pill, Calendar, Clock, Check } from 'lucide-react';
import { API } from '../db';

const ManualLog: React.FC = () => {
  const { medications, setNavigate } = useStore();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    medicationId: '',
    customName: '',
    amount: '',
    date: new Date().toISOString().slice(0, 16)
  });

  const handleSave = async () => {
    if (!formData.medicationId || !formData.amount) return alert(t('selectAndAmount'));
    
    const logData: any = {
      medicationId: formData.medicationId,
      amount_taken: formData.amount,
      timestamp: new Date(formData.date).getTime()
    };

    if (formData.medicationId === 'custom') {
      if (!formData.customName) return alert(t('nameAndDose'));
      logData.medName = formData.customName;
    }

    await API.addLog(logData);
    setNavigate('dashboard');
    window.location.reload();
  };

  const handleMedChange = (id: string) => {
    const med = medications.find(m => m.id === id);
    setFormData({
      ...formData,
      medicationId: id,
      amount: med ? med.dose : ''
    });
  };

  return (
    <div className="glass-panel space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Pill className="text-accent" /> {t('logIntake')}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold opacity-50 mb-1 block">{t('selectMed')}</label>
          <select 
            className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
            value={formData.medicationId}
            onChange={(e) => handleMedChange(e.target.value)}
          >
            <option value="" disabled>{t('chooseOption')}</option>
            {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value="custom">{t('otherMed')}</option>
          </select>
        </div>

        {formData.medicationId === 'custom' && (
          <div className="animate-in fade-in duration-300">
            <label className="text-xs font-bold opacity-50 mb-1 block">{t('nameLbl')}</label>
            <input 
              type="text" 
              className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
              value={formData.customName}
              onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
              placeholder="e.g. Ibuprofen"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold opacity-50 mb-1 block">{t('amountTaken')}</label>
          <input 
            type="number" 
            className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder={t('quantity')}
          />
        </div>

        <div>
          <label className="text-xs font-bold opacity-50 mb-1 block">{t('logDateTime')}</label>
          <input 
            type="datetime-local" 
            className="bg-white/5 border border-white/10 rounded-xl p-3 w-full"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={handleSave} className="btn flex-1">
            <Check size={18} /> {t('recordIntake')}
          </button>
          <button onClick={() => setNavigate('dashboard')} className="btn btn-secondary flex-1">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualLog;
