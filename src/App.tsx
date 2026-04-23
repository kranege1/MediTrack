import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useTranslation } from './hooks/useTranslation';
import { useDataLoader } from './hooks/useDataLoader';
import { LayoutDashboard, Pill, Calendar, History, Settings } from 'lucide-react';
import { cn } from './utils/ui';
import Dashboard from './components/Dashboard';
import MedicationList from './components/MedicationList';
import PlanManager from './components/PlanManager';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import ManualLog from './components/ManualLog';

const App: React.FC = () => {
  const { currentView, setNavigate, setLang } = useStore();
  const { t, lang } = useTranslation();
  useDataLoader(); // This will trigger the initial load

  useEffect(() => {
    console.log('App initialized');
  }, []);

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => setNavigate(view)}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
        currentView === view ? "text-accent scale-110" : "text-white/40 hover:text-white/70"
      )}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
      {currentView === view && (
        <div className="absolute -bottom-2 w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_#4ade80]" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col pb-24 md:pb-0 md:pl-20">
      {/* Header */}
      <header 
        className="p-6 flex justify-between items-start sticky top-0 z-20 backdrop-blur-xl bg-bg-dark/50"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Medica<span className="text-accent">Track</span>
          </h1>
          <p className="text-white/50 text-sm">
            {new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setLang('en')}
            className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", lang === 'en' ? "bg-accent text-black" : "text-white/50")}
          >EN</button>
          <button 
            onClick={() => setLang('de')}
            className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all", lang === 'de' ? "bg-accent text-black" : "text-white/50")}
          >DE</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'medications' && <MedicationList />}
          {currentView === 'plans' && <PlanManager />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'log' && <ManualLog />}
        </div>
      </main>

      {/* Navigation - Bottom Bar for Mobile, Side Bar for Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-50 md:top-0 md:left-0 md:h-full md:w-20 md:flex-col md:justify-center md:gap-12 md:border-r md:border-t-0">
        <NavItem view="dashboard" icon={LayoutDashboard} label={t('home')} />
        <NavItem view="medications" icon={Pill} label={t('meds')} />
        <NavItem view="plans" icon={Calendar} label={t('plans')} />
        <NavItem view="history" icon={History} label={t('history')} />
        <NavItem view="settings" icon={Settings} label={t('settings')} />
      </nav>
    </div>
  );
};


export default App;
