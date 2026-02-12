
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

  useEffect(() => {
    const init = async () => {
      try { 
        await storage.initDatabase(); 
        // Recuperar sessão se necessário (opcional)
      } finally { 
        setIsInitializing(false); 
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    
    const updateCount = async () => {
      const requests = await storage.getRequests();
      const currentUser = authState.user;
      
      const isAdminOrSupport = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPPORT;
      
      const pending = requests.filter(r => {
        const isPending = r.status === 'PENDING';
        if (isAdminOrSupport) return isPending;
        return isPending && r.unitId === currentUser?.unitId;
      }).length;
      
      setPendingCount(pending);
    };

    updateCount();
    const interval = setInterval(updateCount, 30000); // Polling de 30s conforme solicitado
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await storage.getUsers();
    const user = users.find(u => u.username === loginForm.username);
    if (user && loginForm.password === '123') { 
      setAuthState({ user, isAuthenticated: true });
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Use "admin" ou o código da unidade e senha "123".');
    }
  };

  const handleLogout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    setActivePage('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1c2c]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-6"></div>
          <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando Infraestrutura Neon</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-12 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 border border-white/10">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">Corporate Logistics</span>
            </div>
            <h1 className="text-5xl font-black italic mb-3 tracking-tighter bg-gradient-to-br from-white via-indigo-200 to-indigo-600 bg-clip-text text-transparent">
              TONMAN v2
            </h1>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">Inventory Management Terminal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 ml-1">Acesso do Operador</label>
                <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/5 font-medium" placeholder="Ex: admin ou hgsc" required />
              </div>
              <div>
                <label className="block text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 ml-1">Chave de Segurança</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-white/5" placeholder="••••••••" required />
              </div>
            </div>
            {loginError && <p className="text-red-400 text-[10px] font-black text-center bg-red-400/10 py-3 rounded-xl border border-red-500/20 uppercase tracking-tight">{loginError}</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-900/60 transition-all transform hover:-translate-y-1 active:translate-y-0 text-xs tracking-widest">AUTENTICAR NO TERMINAL</button>
          </form>
          <div className="mt-12 text-center text-[8px] text-white/10 font-black uppercase tracking-[0.4em] leading-relaxed">
            Propriedade de TonMan Engineering<br/>Protocolo de Rede Seguro Ativo
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
    <div className="flex h-screen overflow-hidden bg-[#13151a]">
      <Sidebar user={authState.user} activePage={activePage} onPageChange={setActivePage} onLogout={handleLogout} pendingRequestsCount={pendingCount} />
      <main className="flex-1 overflow-y-auto p-10 relative">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto">{renderPage()}</div>
      </main>
    </div>
  );
};

export default App;
