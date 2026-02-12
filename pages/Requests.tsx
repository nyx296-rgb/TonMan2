
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService';
import { GlassCard } from '../components/GlassCard';
import { User, RequestStatus, TransactionType, TonerRequest, Toner, Unit, UserRole } from '../types';

interface RequestsProps {
  user: User | null;
}

export const Requests: React.FC<RequestsProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<TonerRequest[]>([]);
  const [toners, setToners] = useState<Toner[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Regra de Ouro: Somente Admin e Suporte gerenciam.
  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPPORT;

  const fetchData = async () => {
    setLoading(true);
    const [r, t, u] = await Promise.all([
      storage.getRequests(),
      storage.getToners(),
      storage.getUnits()
    ]);
    
    // Filtro de Segurança: Usuário comum só vê a própria unidade.
    // Admin e Suporte vêem tudo.
    const filteredRequests = !canManage && user?.unitId
      ? r.filter(req => req.unitId === user.unitId)
      : r;
      
    setRequests(filteredRequests);
    setToners(t);
    setUnits(u);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAction = async (requestId: string, status: RequestStatus) => {
    if (!canManage) {
      alert("Acesso Negado: Apenas Administradores ou Suporte podem processar solicitações.");
      return;
    }
    
    const req = requests.find(r => r.id === requestId);
    if (!req || !user) return;

    if (status === RequestStatus.APPROVED) {
      // Baixa no estoque da unidade ao aprovar (Efetiva a entrega)
      const success = await storage.updateStock(
        req.unitId, 
        req.tonerId, 
        -req.quantity, 
        user.id, 
        TransactionType.REMOVE, 
        `Solicitação de ${req.sectorName} aprovada e entregue.`
      );
      if (!success) {
        alert("Erro: Saldo insuficiente em estoque para aprovar este pedido.");
        return;
      }
    }
    
    await storage.updateRequestStatus(requestId, status);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING);
  const historicRequests = requests.filter(r => r.status !== RequestStatus.PENDING);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tighter italic uppercase">Gerenciamento de Pedidos</h2>
          <p className="text-white/50 text-sm">
            {canManage 
              ? 'Área Administrativa: Analise e processe os pedidos de insumos.' 
              : 'Meus Pedidos: Acompanhe o status das requisições da sua unidade.'}
          </p>
        </div>
        {!canManage && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="text-indigo-400">ℹ️</span>
            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-none">Visualização Restrita à Unidade</span>
          </div>
        )}
      </header>

      <section className="space-y-6">
        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
          <span>Requisições Pendentes</span>
          {pendingRequests.length > 0 && (
            <span className="bg-indigo-600 text-[9px] px-2 py-0.5 rounded-full font-black text-white shadow-lg shadow-indigo-900/40">
              {pendingRequests.length}
            </span>
          )}
        </h3>
        
        {pendingRequests.length === 0 ? (
          <GlassCard className="text-center py-20 border-dashed border-white/5 bg-transparent">
            <div className="text-4xl mb-4 opacity-20">🍃</div>
            <p className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px]">Tudo limpo por aqui</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map(req => {
              const toner = toners.find(t => t.id === req.tonerId);
              const unit = units.find(u => u.id === req.unitId);
              return (
                <GlassCard key={req.id} className="relative overflow-hidden group border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between h-full hover:bg-white/[0.08]">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-5xl">📦</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="max-w-[70%]">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">{unit?.name}</span>
                        <h4 className="text-lg font-bold text-white leading-tight">{toner?.model}</h4>
                      </div>
                      <div className="bg-indigo-600/20 px-4 py-2 rounded-2xl border border-indigo-500/30 shadow-inner">
                        <span className="text-xl font-black text-indigo-400">x{req.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-black/30 border border-white/5 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner border border-white/5">📍</div>
                      <div>
                        <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Setor Destino</p>
                        <p className="text-sm font-bold text-white/80">{req.sectorName}</p>
                      </div>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleAction(req.id, RequestStatus.REJECTED)}
                        className="flex-1 py-4 rounded-2xl border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95"
                      >
                        Negar
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, RequestStatus.APPROVED)}
                        className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-2xl shadow-indigo-900/60 transition-all active:scale-95"
                      >
                        Aprovar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase text-indigo-400/80 tracking-widest">Aguardando Suporte</span>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">Resumo Histórico</h3>
        <GlassCard className="p-0 overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-white/30 text-[9px] uppercase tracking-widest font-black bg-white/[0.02]">
                  <th className="py-6 px-8">Equipamento Requisitado</th>
                  <th className="py-6 px-8">Origem</th>
                  <th className="py-6 px-8">Status</th>
                  <th className="py-6 px-8 text-right">Data do Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historicRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-white/10 font-black uppercase tracking-[0.3em] text-[10px]">Sem registros no período</td>
                  </tr>
                ) : (
                  historicRequests.map(req => {
                    const toner = toners.find(t => t.id === req.tonerId);
                    const unit = units.find(u => u.id === req.unitId);
                    return (
                      <tr key={req.id} className="text-xs group hover:bg-white/[0.02] transition-colors">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-white/80 group-hover:text-indigo-400 transition-colors text-sm">{toner?.model}</span>
                            <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full font-black text-indigo-400 border border-white/5">x{req.quantity}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <p className="text-white/60 font-medium">{req.sectorName}</p>
                          <p className="text-[9px] font-black uppercase text-white/20 tracking-tighter mt-0.5">{unit?.name}</p>
                        </td>
                        <td className="py-6 px-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex w-fit items-center gap-2 ${
                            req.status === RequestStatus.APPROVED 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${req.status === RequestStatus.APPROVED ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                            {req.status === RequestStatus.APPROVED ? 'APROVADO' : 'RECUSADO'}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-right text-[10px] font-black text-white/20">
                          {new Date(req.timestamp).toLocaleDateString('pt-BR')} • {new Date(req.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
