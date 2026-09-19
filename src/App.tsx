import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useHugo } from './hooks/useHugo';
import { useLiveHugo } from './hooks/useLiveHugo';
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
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from './firebase';
import { cn } from './lib/utils';
import { getUserRole, type UserRole } from './lib/auth';
import { ProvidersProvider } from './contexts/ProvidersContext';
import 'leaflet/dist/leaflet.css';

type ViewId = 'map' | 'wallet' | 'calendar' | 'history' | 'profile' | 'provider' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>('map');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState<string | null>(null);

  const openChatWith = (providerId: string) => {
    setActiveChatTarget(providerId);
    setIsChatOpen(true);
  };

  const {
    state,
    orbState,
    processMessage,
    stopTTS,
    userLocation,
    requestLocation,
    isLocationLoading,
    selectProvider,
  } = useHugo();
  const { isActive: isLiveActive, startLive, stopLive, transcript: liveTranscript, liveError } = useLiveHugo();

  useEffect(() => {
    if (state.ui_action === 'SHOW_PROVIDERS' && state.datos?.proveedores?.length > 0) {
      setActiveView('map');
    }
  }, [state.ui_action, state.datos?.proveedores]);

  useEffect(() => {
    let triedAnonymousLogin = false;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserRole(null);

        if (!triedAnonymousLogin) {
          triedAnonymousLogin = true;
          try {
            await signInAnonymously(auth);
            return;
          } catch (error) {
            console.warn('Anonymous sign-in unavailable. Showing explicit login instead.', error);
          }
        }

        setIsAuthReady(true);
        return;
      }

      setUser(currentUser);

      try {
        const userRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(userRef);

        if (!profileSnap.exists() || !profileSnap.data().role) {
          setUserRole(null);
          setShowRoleSelection(true);
          setActiveView('map');
        } else {
          const role = await getUserRole(currentUser.uid);
          setUserRole(role);
          setShowRoleSelection(false);

          if (role === 'administrador') setActiveView('admin');
          else if (role === 'proveedor') setActiveView('provider');
          else setActiveView('map');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `profiles/${currentUser.uid}`);
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOrbClick = () => {
    if (orbState === 'SPEAKING') stopTTS();
    else if (isLiveActive) stopLive();
    else startLive();
  };

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const commsRef = collection(db, 'comunicaciones');
    const commsQuery = query(commsRef, where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1));

    const unsubscribeComms = onSnapshot(
      commsQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const comm = snapshot.docs[0].data();
        if (comm.mensaje && comm.mensaje !== state.hugo_mensaje) processMessage(comm.mensaje, true);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'comunicaciones')
    );

    return () => unsubscribeComms();
  }, [user, isAuthReady, state.hugo_mensaje, processMessage]);

  const handleHire = () => {
    processMessage(
      'Pedido creado. El profesional ya puede aceptarlo y vas a ver el seguimiento en tiempo real.',
      true
    );
  };

  const handleNavigate = (view: string) => {
    setActiveView(view as ViewId);
    setIsChatOpen(false);
  };

  if (!isAuthReady) {
    return <div className="flex h-screen w-screen items-center justify-center bg-quantum-dark text-white">Carregando UGO…</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-quantum-dark px-6 text-center text-white">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-quantum-cyan">U.G.O.</p>
        <h1 className="text-4xl font-bold">Un pedido. Un profesional. Sin vueltas.</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
          Iniciá sesión para continuar. El modo invitado depende de que Firebase Anonymous Auth esté habilitado.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-8 rounded-full bg-quantum-cyan px-8 py-4 text-base font-bold text-black transition-transform hover:scale-[1.02]"
        >
          Entrar con Google
        </button>
      </div>
    );
  }

  return (
    <ProvidersProvider isAuthReady={isAuthReady} user={user}>
      <HashRouter>
        <div className="quantum-grid relative h-[100dvh] w-screen overflow-hidden bg-quantum-dark">
          {!showRoleSelection && (
            <DashboardNavigation activeView={activeView} userRole={userRole} onNavigate={handleNavigate} />
          )}

          {showRoleSelection && (
            <RoleSelection
              userId={user.uid}
              displayName={user.displayName}
              onRoleSelected={(role) => {
                setUserRole(role);
                setShowRoleSelection(false);
                setActiveView(role === 'proveedor' ? 'provider' : 'map');
              }}
            />
          )}

          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              activeView === 'map' ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'
            )}
          >
            <ClientAppLayout
              user={user}
              state={state}
              orbState={orbState}
              isLiveActive={isLiveActive}
              liveTranscript={liveTranscript}
              liveError={liveError}
              handleOrbClick={handleOrbClick}
              onRequestLocation={requestLocation}
              isLocationLoading={isLocationLoading}
              userLocation={userLocation}
              onHire={handleHire}
              onSelectProvider={selectProvider}
              onChat={openChatWith}
            />
          </div>

          {activeView !== 'map' && (
            <div className="absolute right-4 top-4 z-[80] md:right-6 md:top-6">
              <NotificationBell userId={user.uid} />
            </div>
          )}

          <AnimatePresence>
            {activeView !== 'map' && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={cn(
                  'absolute inset-0 z-40 overflow-y-auto bg-quantum-dark/95 p-4 pb-28 pt-5 backdrop-blur-xl md:bottom-6 md:left-24 md:top-6 md:bg-transparent md:p-0',
                  activeView === 'admin' ? 'md:right-6' : 'md:right-auto md:w-[420px]'
                )}
              >
                {activeView === 'wallet' && <WalletView userId={user.uid} />}
                {activeView === 'calendar' && <CalendarView userId={user.uid} role={userRole} />}
                {activeView === 'history' && <ServiceHistory isOpen userId={user.uid} role={userRole} onClose={() => setActiveView('map')} />}
                {activeView === 'profile' && <UserProfile isOpen userId={user.uid} onClose={() => setActiveView('map')} />}
                {activeView === 'provider' && <ProviderDashboard providerId={user.uid} />}
                {activeView === 'admin' && <AdminPanel />}
              </motion.div>
            )}
          </AnimatePresence>

          {isChatOpen && activeChatTarget && (
            <ChatWindow currentUserId={user.uid} targetUserId={activeChatTarget} onClose={() => setIsChatOpen(false)} />
          )}
        </div>
      </HashRouter>
    </ProvidersProvider>
  );
}
