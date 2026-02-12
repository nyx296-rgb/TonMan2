
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User | null;
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  pendingRequestsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activePage, onPageChange, onLogout, pendingRequestsCount }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR, UserRole.VIEWER] },
    { id: 'inventory', label: 'Estoque', icon: '📦', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR, UserRole.VIEWER] },
    { id: 'requests', label: 'Solicitações', icon: '📨', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR], badge: pendingRequestsCount },
    { id: 'users', label: 'Gerenciamento', icon: '⚙️', roles: [UserRole.ADMIN, UserRole.SUPPORT, UserRole.EDITOR] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 h-full flex flex-col glass border-r border-white/10 shadow-2xl relative z-20">
      <div className="p-8">
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent italic tracking-tighter">
          TONMAN v2
        </h1>
        <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em] mt-1">Hospital System</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
              activePage === item.id 
                ? 'bg-indigo-600/20 text-white shadow-lg border border-indigo-500/30' 
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xl transition-transform duration-300 ${activePage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse border border-white/20">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/30">
              {user?.displayName?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs text-white/90 truncate">{user?.displayName}</p>
              <p className="text-[8px] text-indigo-400 uppercase font-black tracking-widest">{user?.role}</p>
            </div>
          </div>
          
          {user?.unitId && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-[7px] text-white/20 font-black uppercase tracking-widest mb-1">Unidade Ativa</p>
              <p className="text-[10px] text-white/60 font-bold truncate leading-none mb-2 italic">
                {user.unitId.replace('u_', '').toUpperCase()}
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-500/20"
        >
          <span>🚪</span>
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
};
