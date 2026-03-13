
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { DocumentAnalyzer } from './components/DocumentAnalyzer';
import { Drafter } from './components/Drafter';
import { LaborCalculator } from './components/LaborCalculator';
import { SocialSecurityCalculator } from './components/SocialSecurityCalculator';
import { NotificationHub } from './components/NotificationHub';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { auth, db } from './firebase.config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppView, ChatMessage, AnalyzedDocumentHistory, AppNotification, NotificationType, DraftingState, DocumentAnalysisState } from './types';
import { Shield } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CALCULATOR);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  
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
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Check for license expiration
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
          // Initialize user data in Firestore
          const initialData = {
            email: firebaseUser.email,
            isPremium: false,
            licenseType: null,
            accessUntil: null,
            usage: {
              audits: 0,
              generations: 0
            },
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
    text: 'Sistema LexLaboral activo. Estoy a su disposición para brindarle asesoría técnica estratégica en materia de Derecho Laboral Mexicano, Seguridad Social y Relaciones Colectivas. ¿En qué puedo asistirle en esta sesión?' 
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
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    notify("Sesión cerrada correctamente", "info", "Adiós");
  };

  const renderView = () => {
    // Gating for protected views
    const isProtected = [AppView.CHAT, AppView.DOCUMENT_ANALYSIS, AppView.DRAFTING].includes(currentView);
    
    if (isProtected && (!user || !userData?.isPremium)) {
      return (
        <div className="h-full w-full flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-legal-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="text-legal-gold" size={32} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">Acceso por Licencia</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Esta herramienta avanzada requiere una Licencia de Acceso Completo activa. 
              {user ? 'Adquiera su licencia para continuar.' : 'Inicie sesión o regístrese para continuar.'}
            </p>
            <div className="flex flex-col space-y-3">
              {!user ? (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-legal-950 text-white py-3.5 rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Identificarse
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentView(AppView.CHAT)} // In a real app, this might trigger a payment modal
                  className="bg-legal-gold hover:bg-legal-gold/90 text-legal-950 py-3.5 rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Adquirir Licencia
                </button>
              )}
              {isGuestMode && (
                <button 
                  onClick={() => setIsGuestMode(false)}
                  className="text-slate-500 text-sm font-semibold py-2 hover:text-slate-800 transition-colors"
                >
                  Volver al Inicio
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full animate-fade-in relative">
        {(() => {
          switch (currentView) {
            case AppView.CHAT:
              return <ChatInterface messages={chatHistory} setMessages={setChatHistory} analysisHistory={analysisHistory} notify={notify} />;
            case AppView.DOCUMENT_ANALYSIS:
              return <DocumentAnalyzer 
          state={documentAnalysisState} 
          setState={setDocumentAnalysisState} 
          onAddAnalysis={handleAddAnalysis}
          notify={notify}
          user={user}
        />;
      case AppView.DRAFTING:
        return <Drafter 
          state={draftingState} 
          setState={setDraftingState} 
          notify={notify}
          user={user}
        />;
            case AppView.CALCULATOR:
              return <LaborCalculator notify={notify} />;
            case AppView.SOCIAL_SECURITY:
              return <SocialSecurityCalculator notify={notify} />;
            default:
              return <ChatInterface messages={chatHistory} setMessages={setChatHistory} notify={notify} />;
          }
        })()}
      </div>
    );
  };

  useEffect(() => {
    if (window.location.hash === '#payment-success') {
      notify("¡Pago procesado con éxito! Tu cuenta se está actualizando.", "success", "Suscripción Activa");
      window.location.hash = '';
      // Trigger a refresh of user data
      if (user) {
         const userRef = doc(db, 'users', user.uid); // Corrected from user.email to user.uid
         getDoc(userRef).then(docSnap => {
           if (docSnap.exists()) setUserData(docSnap.data() as any);
         });
      }
    } else if (window.location.hash === '#payment-cancelled') {
      notify("El proceso de pago fue cancelado.", "info", "Pago Cancelado");
      window.location.hash = '';
    }
  }, [user, notify]); // Added notify to dependency array

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
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans selection:bg-legal-gold/30">
      <NotificationHub notifications={notifications} onDismiss={dismissNotification} />
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onNewCase={handleNewCase} 
        onLogout={handleLogout}
        user={user}
        isPremium={userData?.isPremium || false}
        isGuest={isGuestMode}
        notify={notify}
      />
      <main className="flex-1 relative overflow-hidden">
        {renderView()}
      </main>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        notify={notify}
      />
    </div>
  );
}

export default App;
