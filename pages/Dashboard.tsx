
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { storage } from '../services/storageService';
import { getColorHex } from '../constants';
import { Toner, UnitToner, Transaction, TonerRequest, Unit, User, UserRole } from '../types';

interface DashboardProps {
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    toners: Toner[],
    unitToners: UnitToner[],
    transactions: Transaction[],
    requests: TonerRequest[],
    units: Unit[],
    users: User[]
  } | null>(null);

  const isGlobalUser = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPPORT;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [t, ut, tr, rq, un, us] = await Promise.all([
        storage.getToners(),
        storage.getUnitToners(),
        storage.getTransactions(),
        storage.getRequests(),
        storage.getUnits(),
        storage.getUsers()
      ]);

      // Filtrar dados sensíveis se o usuário for restrito à unidade
      const filteredUnitToners = isGlobalUser ? ut : ut.filter(item => item.unitId === user?.unitId);
      const filteredRequests = isGlobalUser ? rq : rq.filter(item => item.unitId === user?.unitId);
      const filteredTransactions = isGlobalUser ? tr : tr.filter(item => item.unitId === user?.unitId);
      const filteredUnits = isGlobalUser ? un : un.filter(item => item.id === user?.unitId);

      setData({ 
        toners: t, 
        unitToners: filteredUnitToners, 
        transactions: filteredTransactions, 
        requests: filteredRequests, 
        units: filteredUnits, 
        users: us 
      });
      setLoading(false);
    };
    loadData();
  }, [user, isGlobalUser]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const stockByModel = data.toners.map(t => {
    const total = data.unitToners
      .filter(ut => ut.tonerId === t.id)
      .reduce((sum, current) => sum + current.quantity, 0);
    return { name: t.model, total };
  }).filter(item => item.total > 0);

  const colorsMap: Record<string, number> = {};
  data.unitToners.forEach(ut => {
    const toner = data.toners.find(t => t.id === ut.tonerId);
    if (toner) {
      colorsMap[toner.color] = (colorsMap[toner.color] || 0) + ut.quantity;
    }
  });
  const stockByColor = Object.entries(colorsMap).map(([name, value]) => ({ name, value }));

  const currentUnitName = isGlobalUser ? 'Consolidado Global' : data.units[0]?.name || 'Minha Unidade';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tighter uppercase italic">Dashboard Analytics</h2>
          <p className="text-white/40 font-medium text-sm">
            {isGlobalUser 
              ? 'Visão holística de toda a infraestrutura hospitalar.' 
              : `Monitoramento local: ${currentUnitName}`}
          </p>
        </div>
        {!isGlobalUser && (
           <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-1 rounded-full">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Restrito: Unidade Ativa</span>
           </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="border-l-4 border-l-indigo-500 bg-white/[0.03]">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Volume Total</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{data.unitToners.reduce((a, b) => a + b.quantity, 0)}</p>
          <div className="mt-2 text-[8px] font-bold text-white/20 uppercase">Insumos em prateleira</div>
        </GlassCard>
        <GlassCard className="border-l-4 border-l-red-500 bg-white/[0.03]">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Alertas Críticos</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{data.unitToners.filter(ut => ut.quantity <= ut.minStockAlert).length}</p>
          <div className="mt-2 text-[8px] font-bold text-red-400/50 uppercase">Abaixo da margem de segurança</div>
        </GlassCard>
        <GlassCard className="border-l-4 border-l-yellow-500 bg-white/[0.03]">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Requisições</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{data.requests.filter(r => r.status === 'PENDING').length}</p>
          <div className="mt-2 text-[8px] font-bold text-yellow-500/50 uppercase">Aguardando processamento</div>
        </GlassCard>
        <GlassCard className="border-l-4 border-l-emerald-500 bg-white/[0.03]">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Foco Operacional</p>
          <p className="text-4xl font-black text-white mt-2 tracking-tighter">{data.units.length}</p>
          <div className="mt-2 text-[8px] font-bold text-emerald-500/50 uppercase">{isGlobalUser ? 'Unidades monitoradas' : 'Unidade de atuação'}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard title="Disponibilidade por Modelo">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByModel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(20,22,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }} 
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Mix de Cores em Estoque">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockByColor} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {stockByColor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorHex(entry.name)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,22,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Timeline de Movimentação" className="border-indigo-500/5">
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-white/20 text-[9px] uppercase font-black tracking-[0.2em] bg-white/[0.01]">
                <th className="py-5 px-6">Transação</th>
                <th className="py-5 px-6">Modelo</th>
                <th className="py-5 px-6">Quantidade</th>
                <th className="py-5 px-6">Unidade Responsável</th>
                <th className="py-5 px-6 text-right">Carimbo de Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/10 font-black uppercase tracking-widest text-xs italic">Nenhuma atividade registrada</td>
                </tr>
              ) : (
                data.transactions.slice(0, 8).map(tx => {
                  const toner = data.toners.find(t => t.id === tx.tonerId);
                  const unit = data.units.find(u => u.id === tx.unitId) || { name: 'Unidade Externa' };
                  return (
                    <tr key={tx.id} className="text-xs hover:bg-white/[0.02] transition-all group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${tx.type === 'ADD' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                          <span className={`text-[9px] font-black tracking-widest ${tx.type === 'ADD' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-bold text-white/80 group-hover:text-indigo-400 transition-colors">{toner?.model}</td>
                      <td className="py-5 px-6 text-white/60 font-black">x{tx.quantity}</td>
                      <td className="py-5 px-6 text-white/30 text-[10px] uppercase font-black tracking-tighter">{unit.name}</td>
                      <td className="py-5 px-6 text-right text-white/20 font-medium italic">
                        {new Date(tx.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
