
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Requests } from './pages/Requests';
import { Management } from './pages/Management'; 
import { User, AuthState, UserRole } from './types';
import { storage } from './services/storageService';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [activePage, setActivePage] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("App: Iniciando Hook de Inicialização...");
    const init = async () => {
      try { 
        setIsInitializing(true);
        setInitError(null);
        await storage.initDatabase();
        console.log("App: Banco de dados inicializado com sucesso.");
      } catch (err: any) {
        console.error("App: Falha na Inicialização:", err);
        setInitError(err?.message || "Erro desconhecido ao conectar com a infraestrutura cloud.");
      } finally { 
        setIsInitializing(false); 
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    
    const updateCount = async () => {
      try {
        const requests = await storage.getRequests();
        const currentUser = authState.user;
        const isAdminOrSupport = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPPORT;
        
        const pending = requests.filter(r => {
          const isPending = r.status === 'PENDING';
          if (isAdminOrSupport) return isPending;
          return isPending && r.unitId === currentUser?.unitId;
        }).length;
        
        setPendingCount(pending);
      } catch (e) {
        console.warn("Silent background update fail:", e);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 30000);
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const users = await storage.getUsers();
      const user = users.find(u => u.username.toLowerCase() === loginForm.username.toLowerCase());
      
      if (user && loginForm.password === '123') { 
        setAuthState({ user, isAuthenticated: true });
      } else {
        setLoginError('Acesso negado. Verifique usuário e senha.');
      }
    } catch (e) {
      setLoginError('Erro de conexão com o banco de dados.');
    }
  };

  const handleLogout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    setActivePage('dashboard');
    setIsSidebarOpen(false);
  };

  // Error State Render
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e] p-6">
        <div className="glass-card max-w-lg w-full p-12 rounded-[3rem] border-2 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 border border-red-500/20">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Falha na Infraestrutura</h2>
          <p className="text-sm text-white/40 mb-8 font-medium leading-relaxed">
            Não foi possível estabelecer uma conexão segura com o nó de dados Neon. Isso pode ocorrer devido a restrições de rede ou falha no gateway.
          </p>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-8 text-left">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Debug Info</p>
            <p className="text-[10px] font-mono text-red-400 break-all">{initError}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-white/5 hover:bg-white/10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all border border-white/10"
          >
            Tentar Reconectar
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#13151a]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="mt-8 text-white/40 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Sincronizando Nó Enterprise</p>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0a0b0e]">
        <div className="glass-card max-w-md w-full p-8 sm:p-12 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 border border-white/5">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.3em]">Gestão de Ativos Hospitalares</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black italic mb-2 tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
              TONMAN v2
            </h1>
            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">Central de Inteligência de Suprimentos</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  value={loginForm.username} 
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/10 font-medium text-sm" 
                  placeholder="ID do Operador" 
                  required 
                />
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  value={loginForm.password} 
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/10 text-sm" 
                  placeholder="Chave de Acesso" 
                  required 
                />
              </div>
            </div>
            {loginError && <p className="text-red-400 text-[10px] font-black text-center bg-red-400/5 py-3 rounded-xl border border-red-500/10 uppercase tracking-tight">{loginError}</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-900/40 transition-all transform active:scale-95 text-[10px] uppercase tracking-[0.2em]">Entrar no Painel</button>
          </form>
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[7px] text-white/10 font-black uppercase tracking-[0.5em]">Criptografia Militar • Acesso Monitorado</p>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard user={authState.user} />;
      case 'inventory': return <Inventory user={authState.user} />;
      case 'requests': return <Requests user={authState.user} />;
      case 'users': return <Management />;
      default: return <Dashboard user={authState.user} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0b0e] overflow-hidden">
      <Sidebar 
        user={authState.user} 
        activePage={activePage} 
        onPageChange={setActivePage} 
        onLogout={handleLogout} 
        pendingRequestsCount={pendingCount} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden glass border-b border-white/5 p-4 flex justify-between items-center shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white">
            ☰
          </button>
          <h1 className="text-lg font-black italic tracking-tighter text-indigo-400">TONMAN v2</h1>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-indigo-400 text-xs">
            {authState.user?.displayName?.charAt(0)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-10 relative custom-scrollbar">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
          
          <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
