
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotificationHub } from './components/NotificationHub';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';

// Code Splitting for Performance - Lazy loading large components
const ChatInterface = lazy(() => import('./components/ChatInterface').then(module => ({ default: module.ChatInterface })));
const DocumentAnalyzer = lazy(() => import('./components/DocumentAnalyzer').then(module => ({ default: module.DocumentAnalyzer })));
const Drafter = lazy(() => import('./components/Drafter').then(module => ({ default: module.Drafter })));
const LaborCalculator = lazy(() => import('./components/LaborCalculator').then(module => ({ default: module.LaborCalculator })));
const SocialSecurityCalculator = lazy(() => import('./components/SocialSecurityCalculator').then(module => ({ default: module.SocialSecurityCalculator })));
import { auth, db } from './firebase.config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppView, ChatMessage, AnalyzedDocumentHistory, AppNotification, NotificationType, DraftingState, DocumentAnalysisState } from './types';
import { Shield, Menu, X } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CALCULATOR);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'audit' | 'draft' | '3-months' | '6-months'>('3-months');
  
  const notify = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message, title }]);
    if (type === 'success' || type === 'info') {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }
  }, []);

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.isPremium && data.accessUntil) {
            const now = new Date();
            const expiration = new Date(data.accessUntil);
            if (now > expiration) {
              data.isPremium = false;
              notify("Su licencia de Lex Laboral ha expirado. Renueve para mantener el acceso a las funciones premium.", "warning", "Licencia Vencida");
            }
          }
          setUserData(data);
        } else {
          const initialData = {
            email: firebaseUser.email,
            isPremium: true,
            licenseType: 'validation-bypass',
            accessUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            usage: { audits: 0, generations: 0 },
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, initialData);
          setUserData(initialData);
        }
        setIsGuestMode(false);
        notify(`Bienvenido, ${firebaseUser.email?.split('@')[0]}`, 'success', 'Sesión Iniciada');
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [notify]);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{ 
    role: 'model', 
    text: 'Sistema Lex Laboral activo. Estoy a su disposición para brindarle asesoría técnica estratégica en materia de Derecho Laboral Mexicano, Seguridad Social y Relaciones Colectivas. ¿En qué puedo asistirle en esta sesión?' 
  }]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalyzedDocumentHistory[]>([]);
  const [draftingState, setDraftingState] = useState<DraftingState>({ prompt: '', generatedDoc: '' });
  const [documentAnalysisState, setDocumentAnalysisState] = useState<DocumentAnalysisState>({ files: [], result: null, customInstruction: '' });

  const handleAddAnalysis = (item: AnalyzedDocumentHistory) => {
    setAnalysisHistory(prev => [item, ...prev]);
    notify("Expediente incorporado satisfactoriamente", "success", "Análisis Completado");
  };

  const handleNewCase = () => {
    if (confirm("Al iniciar una nueva sesión se purgarán los datos actuales para garantizar la confidencialidad. ¿Desea proceder?")) {
      setChatHistory([{ role: 'model', text: 'Nueva sesión estratégica iniciada. Quedo a su disposición para cualquier consulta técnica.' }]);
      setAnalysisHistory([]);
      setDraftingState({ prompt: '', generatedDoc: '' });
      setDocumentAnalysisState({ files: [], result: null, customInstruction: '' });
      setCurrentView(AppView.CHAT);
      notify("Memoria volátil purgada. Nueva sesión iniciada.", "info", "Sistema Reiniciado");
      setIsSidebarOpen(false);
    }
  };

  const openPricingModal = (plan: 'audit' | 'draft' | '3-months' | '6-months' = '3-months') => {
    setSelectedPlan(plan);
    setIsPricingModalOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    notify("Sesión cerrada correctamente", "info", "Adiós");
  };

  const renderView = () => {
    const isProtected = [AppView.CHAT, AppView.DOCUMENT_ANALYSIS, AppView.DRAFTING].includes(currentView);
    
    // TEMPORARY LOGIC: Any registered user (user != null) has full access today without paying
    // isPremium check is bypassed for now to allow full access upon registration.
    if (isProtected && !user) {
      return (
        <div className="h-full w-full flex items-center justify-center p-4 md:p-6 text-center animate-fade-in">
          <div className="max-w-md w-full bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-legal-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="text-legal-gold" size={32} />
            </div>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-4">Acceso Reservado</h3>
            <p className="text-sm md:text-base text-slate-600 mb-8 leading-relaxed">
              El día de hoy, esta herramienta avanzada está disponible en su totalidad de forma gratuita para todos los usuarios registrados.
              Inicie sesión o regístrese para continuar.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-legal-950 text-white py-3.5 rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95"
              >
                Identificarse o Registrarse
              </button>
              {isGuestMode && (
                <button 
                  onClick={() => setCurrentView(AppView.CALCULATOR)}
                  className="text-slate-500 text-xs md:text-sm font-semibold py-2 hover:text-slate-800 transition-colors"
                >
                  Regresar a la Calculadora
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full animate-fade-in relative overflow-y-auto">
        <Suspense fallback={
          <div className="h-full w-full flex items-center justify-center">
             <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin mb-3"></div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cargando Módulo...</span>
             </div>
          </div>
        }>
          {(() => {
            switch (currentView) {
              case AppView.CHAT:
                return <ChatInterface messages={chatHistory} setMessages={setChatHistory} analysisHistory={analysisHistory} notify={notify} user={user} userData={userData} />;
              case AppView.DOCUMENT_ANALYSIS:
                return <DocumentAnalyzer
                  state={documentAnalysisState}
                  setState={setDocumentAnalysisState}
                  onAddAnalysis={handleAddAnalysis}
                  notify={notify}
                  user={user}
                  userData={userData}
                  onUpgrade={() => openPricingModal('audit')}
                />;
              case AppView.DRAFTING:
                return <Drafter
                  state={draftingState}
                  setState={setDraftingState}
                  notify={notify}
                  user={user}
                  userData={userData}
                  onUpgrade={() => openPricingModal('draft')}
                />;
              case AppView.CALCULATOR:
                return <LaborCalculator notify={notify} user={user} userData={userData} />;
              case AppView.SOCIAL_SECURITY:
                return <SocialSecurityCalculator notify={notify} user={user} userData={userData} />;
              default:
                return <ChatInterface messages={chatHistory} setMessages={setChatHistory} notify={notify} user={user} userData={userData} />;
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
          isPremium={userData?.isPremium || false}
          isGuest={isGuestMode}
          notify={notify}
          onOpenPricing={openPricingModal}
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
    </div>
  );
}

export default App;
