
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { LegalView } from './components/LegalView';
import { NotificationHub } from './components/NotificationHub';
import { PricingModal } from './components/PricingModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './components/AuthProvider';
import { LoginModal } from './components/LoginModal';

// Lazy loading components
const Drafter = lazy(() => import('./components/Drafter').then(module => ({ default: module.Drafter })));
const LaborCalculator = lazy(() => import('./components/LaborCalculator').then(module => ({ default: module.LaborCalculator })));
const SocialSecurityCalculator = lazy(() => import('./components/SocialSecurityCalculator').then(module => ({ default: module.SocialSecurityCalculator })));

import { AppView, AppNotification, NotificationType, DraftingState } from './types';
import { Menu, X } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'draft_basic' | 'mensualidad'>('draft_basic');
  const [draftingState, setDraftingState] = useState<DraftingState>({ prompt: '', generatedDoc: '' });

  const { user, credits } = useAuth();

  const notify = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, title }]);
    if (type === 'success' || type === 'info') {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    }
  }, []);

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const openPricingModal = (plan: 'draft_basic' | 'mensualidad' = 'draft_basic') => {
    setSelectedPlan(plan);
    setIsPricingModalOpen(true);
  };

  const renderView = () => {
    return (
      <div className="h-full w-full animate-fade-in relative overflow-y-auto">
        <Suspense fallback={
          <div className="h-full w-full min-h-[600px] flex items-center justify-center animate-in fade-in duration-500">
             <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin mb-3"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Iniciando Herramienta...</span>
             </div>
          </div>
        }>
          {(() => {
            switch (currentView) {
              case AppView.HOME:
                return <Home onNavigate={setCurrentView} />;
              case AppView.DRAFTING:
                return <Drafter
                  state={draftingState}
                  setState={setDraftingState}
                  notify={notify}
                  onUpgrade={(plan) => openPricingModal((plan || 'draft_basic') as 'draft_basic' | 'mensualidad')}
                  onAuthRequired={() => setIsLoginModalOpen(true)}
                />;
              case AppView.CALCULATOR:
                return <LaborCalculator notify={notify} />;
              case AppView.SOCIAL_SECURITY:
                return <SocialSecurityCalculator notify={notify} />;
              case AppView.TERMS:
                return <LegalView type={AppView.TERMS} onBack={() => setCurrentView(AppView.HOME)} />;
              case AppView.PRIVACY:
                return <LegalView type={AppView.PRIVACY} onBack={() => setCurrentView(AppView.HOME)} />;
              default:
                return <Home onNavigate={setCurrentView} />;
            }
          })()}
        </Suspense>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden font-sans selection:bg-legal-gold/30">
        <NotificationHub notifications={notifications} onDismiss={dismissNotification} />
      
      {currentView !== AppView.HOME && (
        <>
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between px-6 py-4 bg-legal-950 text-white z-40 border-b border-white/5 shadow-2xl">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setCurrentView(AppView.HOME)}
            >
               <img src="/assets/logo.webp" alt="Logo" className="w-8 h-8 rounded-lg" loading="lazy" />
               <span className="font-serif font-bold text-lg">Lex Laboral</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Sidebar Overlay for Mobile */}
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Container */}
          <div className={`fixed inset-y-0 left-0 z-[70] transition-transform duration-300 transform md:relative md:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <Sidebar 
              currentView={currentView} 
              onChangeView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} 
              onNewCase={() => setCurrentView(AppView.HOME)} 
              onLogout={() => {}}
              user={null}
              userData={null}
              isPremium={false}
              isGuest={true}
              notify={notify}
              onOpenPricing={openPricingModal}
            />
          </div>
        </>
      )}

      <main className="flex-1 relative overflow-hidden flex flex-col h-full bg-slate-50">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {renderView()}
        </div>
      </main>

      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
        notify={notify} 
        initialPlan={selectedPlan}
        onRequireLogin={() => setIsLoginModalOpen(true)}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      </div>
    </ErrorBoundary>
  );
}

export default App;
