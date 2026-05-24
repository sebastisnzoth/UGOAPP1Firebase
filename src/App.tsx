import { useState, useEffect } from 'react';
import { useHugo } from './hooks/useHugo';
import { useLiveHugo } from './hooks/useLiveHugo';
import HugoOrb from './components/HugoOrb';
import QuantumMap from './components/QuantumMap';
import ProviderDrawer from './components/ProviderDrawer';
import ServiceHistory from './components/ServiceHistory';
import UserProfile from './components/UserProfile';
import WalletView from './components/WalletView';
import CalendarView from './components/CalendarView';
import ChatWindow from './components/ChatWindow';
import DashboardNavigation from './components/DashboardNavigation';
import NotificationBell from './components/NotificationBell';
import ProviderDashboard from './components/ProviderDashboard';
import AdminPanel from './components/AdminPanel';
import RoleSelection from './components/RoleSelection';
import ClientAppLayout from './components/ClientAppLayout';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from './firebase';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { cn } from './lib/utils';
import { History, User as UserIcon, Calendar } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { getUserRole } from './lib/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [activeView, setActiveView] = useState('map'); // 'map' | 'wallet' | 'calendar' | 'history' | 'profile' | 'provider' | 'admin'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState<string | null>(null);

  const openChatWith = (providerId: string) => {
    setActiveChatTarget(providerId);
    setIsChatOpen(true);
  };
  
	const { state, orbState, processMessage, analyzeMedia, sayWelcome, stopTTS, userLocation, requestLocation, selectProvider } = useHugo();
  const { isActive: isLiveActive, startLive, stopLive, transcript: liveTranscript } = useLiveHugo();

  // Watch for SHOW_PROVIDERS action to open drawer
  useEffect(() => {
    if (state.ui_action === 'SHOW_PROVIDERS' && state.datos?.proveedores && state.datos.proveedores.length > 0) {
      setActiveView('map');
    }
  }, [state.ui_action, state.datos?.proveedores]);

  // Auth Listener
  useEffect(() => {
    let triedAnon = false;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAuthReady(true);
        
        // Sync user profile to Firestore
        const userRef = doc(db, 'profiles', currentUser.uid);
        
        try {
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            // New user, show role selection
            setShowRoleSelection(true);
            setDoc(userRef, {
              uid: currentUser.uid,
              nombre: currentUser.displayName || 'Usuário Quantum',
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `profiles/${currentUser.uid}`));
          } else {
            const data = docSnap.data();
            if(!data.tipo) {
                setShowRoleSelection(true);
            } else {
                // Redirección basada en rol al iniciar sesión
                const role = await getUserRole(currentUser.uid);
                if (role === 'soberano') setActiveView('admin');
                else if (role === 'prestador') setActiveView('provider');
                else setActiveView('map');
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `profiles/${currentUser.uid}`);
        }
      } else {
        if (!triedAnon) {
          triedAnon = true;
          try {
            await signInAnonymously(auth);
          } catch (error) {
            console.warn("Anonymous sign in failed, bypassing with hardcoded guest session:", error);
            const guestUserObj = {
              uid: 'guest_user',
              displayName: 'Invitado Quantum',
              email: 'guest@quantum-os.com',
              emailVerified: true,
              isAnonymous: true,
              metadata: {},
              providerData: [],
              providerId: 'firebase',
              tenantId: null,
              delete: async () => {},
              getIdToken: async () => 'mock-token',
              getIdTokenResult: async () => ({}) as any,
              reload: async () => {},
              toJSON: () => ({}),
            } as unknown as User;
            setUser(guestUserObj);
            setIsAuthReady(true);
            
            // Sync guest profile to DB
            const userRef = doc(db, 'profiles', 'guest_user');
            try {
              const docSnap = await getDoc(userRef);
              if (!docSnap.exists()) {
                await setDoc(userRef, {
                  uid: 'guest_user',
                  nombre: 'Invitado Quantum',
                  tipo: 'cliente',
                  updatedAt: serverTimestamp(),
                  createdAt: serverTimestamp()
                });
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, 'profiles/guest_user');
            }
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);


  const handleOrbClick = () => {
    if (orbState === 'SPEAKING') {
      stopTTS();
    } else if (isLiveActive) {
      stopLive();
    } else {
      startLive();
    }
  };

  // Firestore Real-time Listeners (Tasks/Providers/Communications)
  useEffect(() => {
    if (!user || !isAuthReady) return;

    // Listen for Hugo's communications (Voice/Text)
    const commsRef = collection(db, 'comunicaciones');
    const q = query(commsRef, where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribeComms = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const comm = snapshot.docs[0].data();
        // Avoid repeating the same message
        if (comm.mensaje !== state.hugo_mensaje) {
          processMessage(comm.mensaje, true); // true flag for external trigger
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'comunicaciones'));

    return () => {
      unsubscribeComms();
    };
  }, [user, isAuthReady, state.hugo_mensaje, processMessage]);

  // Listen for Providers
  useEffect(() => {
    if (!isAuthReady || !user) return;
    
    // Fetch providers from Firestore
    const providersRef = collection(db, 'profiles');
    const q = query(providersRef, where('tipo', '==', 'prestador'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const providersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProviders(providersList);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'profiles (providers)'));

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const handleHire = (providerName: string) => {
    processMessage(`Hugo, quiero contratar a ${providerName}.`);
  };

  if (!isAuthReady) return <div className="h-screen w-screen bg-quantum-dark flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return (
    <div className="h-screen w-screen bg-quantum-dark flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-8 text-quantum-cyan">U.go Quantum OS</h1>
      <button 
        onClick={signInWithGoogle}
        className="bg-quantum-cyan text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
      >
        Entrar com Google
      </button>
    </div>
  );

  return (
    <div className="relative h-[100dvh] w-screen bg-quantum-dark overflow-hidden quantum-grid">
      {/* DashboardNavigation is now managed within views or left here for persistent access if needed */}
      <DashboardNavigation activeView={activeView} onViewChange={setActiveView} userId={user?.uid || ''} />

      {showRoleSelection && (
        <RoleSelection userId={user.uid} onRoleSelected={() => {
            setShowRoleSelection(false);
            window.location.reload();
        }} />
      )}

      {activeView === 'map' && user && (
        <ClientAppLayout 
          user={user}
          state={state}
          orbState={orbState}
          isLiveActive={isLiveActive}
          liveTranscript={liveTranscript}
          handleOrbClick={handleOrbClick}
          onRequestLocation={requestLocation}
          providers={providers.filter(p => {
            const lat = Number(p.latitude ?? p.lat);
            const lng = Number(p.longitude ?? p.lng);
            return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
          })}
          onHire={handleHire}
          onSelectProvider={selectProvider}
        />
      )}

      {/* Dynamic Content Overlay (replaced Drawers/Modals) */}
      <AnimatePresence>
        {activeView !== 'map' && user && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute top-6 left-24 bottom-6 w-96 z-40"
          >
            {activeView === 'wallet' && <WalletView userId={user.uid} />}
            {activeView === 'calendar' && <CalendarView userId={user.uid} />}
            {activeView === 'history' && <ServiceHistory isOpen={true} userId={user.uid} onClose={() => setActiveView('map')} />}
            {activeView === 'profile' && <UserProfile isOpen={true} userId={user.uid} onClose={() => setActiveView('map')} />}
            {activeView === 'provider' && <ProviderDashboard providerId={user.uid} />}
            {activeView === 'admin' && <AdminPanel />}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Window */}
      {isChatOpen && activeChatTarget && user && (
        <ChatWindow
          currentUserId={user.uid}
          targetUserId={activeChatTarget}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

