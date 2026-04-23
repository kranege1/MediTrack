import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { API } from '../db';

export function useDataLoader() {
  const setData = useStore((state) => state.setData);

  const refreshData = async () => {
    try {
      const medications = await API.getMedications();
      const logs = await API.getLogs();
      const metrics = await API.getMetrics();
      const plans = await API.getPlans();

      setData('medications', medications);
      setData('logs', logs);
      setData('metrics', metrics);
      setData('plans', plans);

      // Load local JSON databases
      const medRes = await fetch('/drugs.json');
      if (medRes.ok) {
        const data = await medRes.json();
        const localDrugs = (data.kategorien || []).flatMap((cat: any) => 
          (cat.eintraege || []).map((entry: any) => ({ ...entry, einsatzgebiet: cat.bereich }))
        );
        setData('localDrugs', localDrugs);
      }

      const docRes = await fetch('/doctors.json');
      if (docRes.ok) {
        const data = await docRes.json();
        const localDoctors = (data.aerzte || []).flatMap((cat: any) => 
          (cat.daten || []).map((doc: any) => ({ ...doc, specialty: cat.kategorie }))
        );
        setData('localDoctors', localDoctors);
      }
    } catch (e) {
      console.warn("Failed to load data", e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return { refreshData };
}
