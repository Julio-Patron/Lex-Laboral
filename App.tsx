
import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { Home } from './components/Home';
import { NotificationHub } from './components/NotificationHub';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackEvent } from './lib/analytics';
import { updateSEO } from './lib/seo';
import { getPathForView, getViewForPath } from './lib/routes';

// Lazy loading components
const Sidebar = lazy(() => import('./components/Sidebar').then(module => ({ default: module.Sidebar })));
const LegalView = lazy(() => import('./components/LegalView').then(module => ({ default: module.LegalView })));
const LaborCalculator = lazy(() => import('./components/LaborCalculator').then(module => ({ default: module.LaborCalculator })));
const SocialSecurityCalculator = lazy(() => import('./components/SocialSecurityCalculator').then(module => ({ default: module.SocialSecurityCalculator })));
const PensionCalculator = lazy(() => import('./components/PensionCalculator').then(module => ({ default: module.PensionCalculator })));
const Consultas = lazy(() => import('./components/Consultas').then(module => ({ default: module.Consultas })));
const GovernmentSourcesView = lazy(() => import('./components/GovernmentSourcesView').then(module => ({ default: module.GovernmentSourcesView })));

import { AppView } from './types';
import type { AppNotification, NotificationType } from './types';
import { MobileBottomNav } from './components/MobileBottomNav';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => getViewForPath(window.location.pathname));
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('lex.sidebar.collapsed') === 'true';
  });

  const notify = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, title }]);
    if (type === 'success' || type === 'info') {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    }
  }, []);

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  // SEO: update tags on mount with initial view
  useEffect(() => {
    updateSEO(currentView);
  }, [currentView]);

  // Cada herramienta es un recorrido independiente: debe empezar desde su encabezado,
  // incluso al usar Atrás/Adelante del navegador.
  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentView]);

  // Change view with analytics and SEO
  const handleViewChange = useCallback((view: AppView) => {
    setCurrentView(view);
    const nextPath = getPathForView(view);
    const currentPath = window.location.pathname;
    if (nextPath !== currentPath) {
      window.history.pushState({}, '', nextPath);
    }
    trackEvent('view_changed', { view });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentView(getViewForPath(window.location.pathname));
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('lex.sidebar.collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = (event?: MediaQueryListEvent) => {
      setIsMobileViewport(event ? event.matches : mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  const isMobileSidebarHidden = isMobileViewport && !isSidebarOpen;

  const renderView = () => {
    return (
      <div className="min-h-full w-full animate-fade-in relative pb-20 md:pb-0">
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
                return <Home onNavigate={handleViewChange} />;
              case AppView.CALCULATOR:
                return (
                  <LaborCalculator
                    notify={notify}
                    onOpenImss={() => handleViewChange(AppView.SOCIAL_SECURITY)}
                  />
                );
              case AppView.SOCIAL_SECURITY:
                return <SocialSecurityCalculator 
                  notify={notify} 
                />;
              case AppView.PENSION_CALCULATOR:
                return <PensionCalculator
                  notify={notify}
                />;
              case AppView.CONSULTAS:
                return <Consultas />;
              case AppView.TERMS:
                return <LegalView type={AppView.TERMS} onBack={() => handleViewChange(AppView.HOME)} />;
              case AppView.PRIVACY:
                return <LegalView type={AppView.PRIVACY} onBack={() => handleViewChange(AppView.HOME)} />;
              case AppView.SOURCES:
                return <GovernmentSourcesView onBack={() => handleViewChange(AppView.HOME)} onNavigate={handleViewChange} />;
              default:
                return <Home onNavigate={handleViewChange} />;
            }
          })()}
        </Suspense>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-slate-100 font-sans selection:bg-legal-gold/30 md:flex-row">
        <NotificationHub notifications={notifications} onDismiss={dismissNotification} />
      
      {currentView !== AppView.HOME && (
        <>
          {/* Mobile Header */}
          <div className="z-40 flex shrink-0 items-center justify-center border-b border-white/5 bg-legal-950 px-4 py-3.5 text-white shadow-2xl md:hidden">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => handleViewChange(AppView.HOME)}
            >
               <img src="/assets/logo.webp" alt="Lex Laboral" className="h-8 w-auto object-contain" loading="lazy" />
            </div>
          </div>

          {/* Sidebar Overlay for Mobile */}
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden="true"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Container */}
          <div
            className={`fixed inset-y-0 left-0 z-[70] max-w-[86vw] transform transition-transform duration-300 ease-out md:relative md:max-w-none md:translate-x-0 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } hidden md:block`}
            aria-hidden={isMobileSidebarHidden}
            inert={isMobileSidebarHidden}
          >
            <Suspense fallback={null}>
              <Sidebar
                currentView={currentView}
                onChangeView={(v) => { handleViewChange(v); setIsSidebarOpen(false); }}
                onNewCase={() => handleViewChange(AppView.HOME)}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
              />
            </Suspense>
          </div>
        </>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <div ref={contentScrollRef} className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          {renderView()}
        </div>
      </main>

      <MobileBottomNav currentView={currentView} onChangeView={handleViewChange} />

      </div>
    </ErrorBoundary>
  );
}

export default App;
