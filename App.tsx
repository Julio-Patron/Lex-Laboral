
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotificationHub } from './components/NotificationHub';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { saveSession, getUserSessions } from './services/history';

// Code Splitting for Performance - Lazy loading large components
const ChatInterface = lazy(() => import('./components/ChatInterface').then(module => ({ default: module.ChatInterface })));
const Drafter = lazy(() => import('./components/Drafter').then(module => ({ default: module.Drafter })));
const LaborCalculator = lazy(() => import('./components/LaborCalculator').then(module => ({ default: module.LaborCalculator })));
const SocialSecurityCalculator = lazy(() => import('./components/SocialSecurityCalculator').then(module => ({ default: module.SocialSecurityCalculator })));
import { auth, db } from './firebase.config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppView, ChatMessage, AnalyzedDocumentHistory, AppNotification, NotificationType, DraftingState, ChatSession } from './types';
import { Shield, Menu, X } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'audit' | 'draft_basic' | 'draft_custom' | '3-months'>('3-months');
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(crypto.randomUUID());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{ 
    role: 'model', 
    text: 'Sistema Lex Laboral activo. Estoy a su disposición para brindarle asesoría técnica estratégica en materia de Derecho Laboral Mexicano, Seguridad Social y Relaciones Colectivas. ¿En qué puedo asistirle en esta sesión?' 
  }]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalyzedDocumentHistory[]>([]);
  const [draftingState, setDraftingState] = useState<DraftingState>({ prompt: '', generatedDoc: '' });

  const notify = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, title }]);
    if (type === 'success' || type === 'info') {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    }
  }, []);

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isPremium && data.expiresAt) {
              const now = new Date();
              const expiration = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
              if (now > expiration) {
                data.isPremium = false;
                notify("Su licencia de Lex Laboral ha expirado.", "warning", "Licencia Vencida");
              }
            }
            setUserData(data);
          } else {
            // Updated to match firestore.rules requirements
            const initialData = {
              email: firebaseUser.email,
              isPremium: false,
              licenseType: 'free',
              accessUntil: new Date(new Date().getFullYear() + 10, 0, 1).toISOString(), // Dummy date for free users
              usage: { audits: 0, generations: 0, chats: 0 },
              credits: { audits: 0, draft_basic: 0, draft_custom: 0 },
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialData);
            setUserData(initialData);
          }
          
          // Load sessions
          getUserSessions(firebaseUser.uid).then(setSessions);
          
          setIsGuestMode(false);
          notify(`Bienvenido, ${firebaseUser.email?.split('@')[0]}`, 'success', 'Sesión Iniciada');
        } else {
          setUserData(null);
          setSessions([]);
        }
      } catch (error) {
        console.error("Auth status sync error:", error);
        // Don't notify on every check, but log it
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [notify]);

  // Auto-save session when chat history changes
  useEffect(() => {
    if (user && chatHistory.length > 1) {
      // Small delay to prevent too many writes if typing fast (though handlesend is sequential)
      const timeout = setTimeout(() => {
        saveSession(user.uid, currentSessionId, chatHistory).then(() => {
          getUserSessions(user.uid).then(setSessions);
        }).catch(err => console.error("Auto-save failed", err));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [chatHistory, currentSessionId, user]);

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setChatHistory(session.messages);
      setCurrentView(AppView.CHAT);
    }
  };

  const handleAddAnalysis = (item: AnalyzedDocumentHistory) => {
    setAnalysisHistory(prev => [item, ...prev]);
    notify("Expediente incorporado satisfactoriamente", "success", "Análisis Completado");
  };

  const executeNewCase = () => {
    setCurrentSessionId(crypto.randomUUID());
    setChatHistory([{ role: 'model', text: 'Nueva sesión estratégica iniciada. Quedo a su disposición para cualquier consulta técnica.' }]);
    setAnalysisHistory([]);
    setDraftingState({ prompt: '', generatedDoc: '' });
    setCurrentView(AppView.CHAT);
    notify("Memoria volátil purgada. Nueva sesión iniciada.", "info", "Sistema Reiniciado");
    setIsSidebarOpen(false);
    setIsConfirmModalOpen(false);
  };

  const handleNewCase = () => {
    if (isGuestMode) {
      notify("Debe iniciar sesión para crear una nueva consulta jurídica.", "warning", "Acceso Restringido");
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const openPricingModal = (plan: 'audit' | 'draft_basic' | 'draft_custom' | '3-months' = '3-months') => {
    if (!user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedPlan(plan);
    setIsPricingModalOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    notify("Sesión cerrada correctamente", "info", "Adiós");
  };

  const renderView = () => {
    return (
      <div className="h-full w-full animate-fade-in relative overflow-y-auto">
        <Suspense fallback={
          <div className="h-full w-full min-h-[600px] flex items-center justify-center animate-in fade-in duration-500">
             <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin mb-3"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Iniciando Módulo...</span>
             </div>
          </div>
        }>
          {(() => {
            switch (currentView) {
              case AppView.CHAT:
                return <ChatInterface messages={chatHistory} setMessages={setChatHistory} analysisHistory={analysisHistory} notify={notify} user={user} onAuthRequired={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} />;
              case AppView.DOCUMENT_ANALYSIS:
                return <ChatInterface messages={chatHistory} setMessages={setChatHistory} analysisHistory={analysisHistory} notify={notify} user={user} onAuthRequired={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} />;
              case AppView.DRAFTING:
                return <Drafter
                  state={draftingState}
                  setState={setDraftingState}
                  notify={notify}
                  user={user}
                  userData={userData}
                  onUpgrade={(plan) => openPricingModal(plan || 'draft_basic')}
                  onAuthRequired={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                />;
              case AppView.CALCULATOR:
                return <LaborCalculator notify={notify} user={user} userData={userData} onAuthRequired={() => setIsAuthModalOpen(true)} />;
              case AppView.SOCIAL_SECURITY:
                return <SocialSecurityCalculator notify={notify} user={user} userData={userData} onAuthRequired={() => setIsAuthModalOpen(true)} />;
              default:
                return <ChatInterface messages={chatHistory} setMessages={setChatHistory} notify={notify} user={user} onAuthRequired={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} />;
            }
          })()}
        </Suspense>
      </div>
    );
  };

  useEffect(() => {
    if (window.location.hash === '#payment-success') {
      notify("¡Pago procesado con éxito! Tu cuenta se está actualizando.", "success", "Suscripción Activa");
      window.location.hash = '';
      if (user) {
         const userRef = doc(db, 'users', user.uid);
         getDoc(userRef).then(docSnap => {
           if (docSnap.exists()) setUserData(docSnap.data() as any);
         });
      }
    } else if (window.location.hash === '#payment-cancelled') {
      notify("El proceso de pago fue cancelado.", "info", "Pago Cancelado");
      window.location.hash = '';
    }
  }, [user, notify]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Iniciando Ecosistema Lex Laboral</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return (
      <>
        <LandingPage 
          onGetStarted={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }} 
          onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
          onTryCalculator={(type) => {
            setIsGuestMode(true);
            setCurrentView(type === 'labor' ? AppView.CALCULATOR : AppView.SOCIAL_SECURITY);
          }}
        />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          notify={notify}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden font-sans selection:bg-legal-gold/30">
      <NotificationHub notifications={notifications} onDismiss={dismissNotification} />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-legal-950 text-white z-40 border-b border-white/5">
        <div className="flex items-center space-x-2">
           <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
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
          onNewCase={handleNewCase} 
          onLogout={handleLogout}
          user={user}
          userData={userData}
          isPremium={userData?.isPremium || false}
          isGuest={isGuestMode}
          notify={notify}
          onOpenPricing={openPricingModal}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={loadSession}
        />
      </div>

      <main className="flex-1 relative overflow-hidden flex flex-col h-full bg-slate-50">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {renderView()}
        </div>
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        notify={notify}
      />
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
        user={user} 
        notify={notify} 
        initialPlan={selectedPlan}
      />

      {/* Custom Confirm Modal for New Session */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-legal-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-slate-100 scale-100 transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-red-50 text-red-500 rounded-2xl mx-auto mb-6">
               <Shield size={32} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-center text-slate-900 mb-3">¿Iniciar nueva sesión?</h3>
            <p className="text-center text-slate-600 mb-8 text-sm leading-relaxed">
              Al iniciar un nuevo expediente se purgarán los datos de la sesión actual de la memoria volátil para garantizar la confidencialidad. Los datos no guardados se perderán.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeNewCase}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Purgar e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
