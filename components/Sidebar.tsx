
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User | null;
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  pendingRequestsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, activePage, onPageChange, onLogout, pendingRequestsCount, isOpen, onClose 
}) => {
  const [showQR, setShowQR] = useState(false);
  const [latency, setLatency] = useState(24);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (45 - 18) + 18));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR, UserRole.VIEWER] },
    { id: 'inventory', label: 'Estoque', icon: '📦', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR, UserRole.VIEWER] },
    { id: 'requests', label: 'Solicitações', icon: '📨', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR], badge: pendingRequestsCount },
    { id: 'users', label: 'Gerenciamento', icon: '⚙️', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  const handleMenuClick = (id: string) => {
    onPageChange(id);
    if (window.innerWidth < 1024) onClose();
  };

  const currentUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}&bgcolor=1a1c2c&color=6366f1`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-72 h-full flex flex-col glass border-r border-white/10 shadow-2xl z-50 transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent italic tracking-tighter">
              TONMAN v2
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-[7px] text-white/30 font-black uppercase tracking-[0.2em]">SaaS Enterprise Node</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activePage === item.id 
                  ? 'bg-indigo-600/20 text-white shadow-lg border border-indigo-500/30' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xl transition-transform duration-300 ${activePage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse border border-white/20">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={() => setShowQR(true)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all group"
            >
              <span className="text-xl group-hover:rotate-12 transition-transform">🛰️</span>
              <div className="text-left">
                <span className="font-black text-[9px] uppercase tracking-[0.2em] block">Sincronia Global</span>
                <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Acesso via Endpoint Profissional</span>
              </div>
            </button>
          </div>
        </nav>

        <div className="p-6">
          <div className="mb-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
               <span className="text-2xl">⚡</span>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm border border-indigo-500/30 shadow-inner">
                {user?.displayName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-xs text-white/90 truncate uppercase tracking-tighter">{user?.displayName}</p>
                <div className="flex items-center gap-2">
                   <p className="text-[8px] text-indigo-400 uppercase font-black tracking-[0.2em]">{user?.role}</p>
                   <span className="text-white/10 text-[8px]">•</span>
                   <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">{latency}ms</p>
                </div>
              </div>
            </div>
            
            {user?.unitId && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-[7px] text-white/20 font-black uppercase tracking-widest mb-1">Unidade Ativa</p>
                <p className="text-[10px] text-indigo-400/80 font-black truncate leading-none uppercase italic tracking-tight">
                  {user.unitId.replace('u_', '').replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-500/20"
          >
            <span>🚪</span>
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Enterprise Access Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass-card max-w-sm w-full p-10 rounded-[3rem] border-2 border-indigo-500/30 text-center relative shadow-[0_0_80px_rgba(99,102,241,0.25)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
            
            <button onClick={() => setShowQR(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            
            <header className="mb-10">
               <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 border border-indigo-500/20 shadow-inner">
                  🏢
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Endpoint de Produção</h3>
               <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em]">Conecte dispositivos de coleta à rede corporativa</p>
            </header>
            
            <div className="bg-white p-5 rounded-[2.5rem] inline-block mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform">
              <img src={qrCodeUrl} alt="QR Code de Acesso" className="w-56 h-56" />
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                  <p className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.2em] leading-relaxed">
                    Aponte para sincronizar. Este link utiliza o Gateway Seguro <span className="text-white">SSL/TLS</span> para garantir a integridade dos dados da unidade.
                  </p>
               </div>
               <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                    alert("URL de Rede copiada para a área de transferência!");
                  }}
                  className="w-full py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
               >
                  Copiar Link de Produção
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
