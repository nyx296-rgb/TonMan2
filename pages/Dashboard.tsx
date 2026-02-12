
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        <p className="text-white/10 font-black uppercase tracking-[0.3em] text-[8px]">Indexando Analytics...</p>
      </div>
    );
  }

  const stockByModel = data.toners.map(t => {
    const total = data.unitToners
      .filter(ut => ut.tonerId === t.id)
      .reduce((sum, current) => sum + current.quantity, 0);
    return { name: t.model.split(' ')[0], full: t.model, total };
  }).filter(item => item.total > 0).slice(0, 6);

  const colorsMap: Record<string, number> = {};
  data.unitToners.forEach(ut => {
    const toner = data.toners.find(t => t.id === ut.tonerId);
    if (toner) {
      colorsMap[toner.color] = (colorsMap[toner.color] || 0) + ut.quantity;
    }
  });
  const stockByColor = Object.entries(colorsMap).map(([name, value]) => ({ name, value }));

  const currentUnitName = isGlobalUser ? 'Consolidado Global' : data.units[0]?.name || 'Unidade Local';

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-white/90 tracking-tighter uppercase italic leading-none">Visão Geral</h2>
          <p className="text-white/30 font-black uppercase text-[8px] sm:text-[10px] tracking-[0.2em] mt-2">
            {isGlobalUser 
              ? 'Status Operacional de Rede' 
              : `Terminal: ${currentUnitName}`}
          </p>
        </div>
        {!isGlobalUser && (
           <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Acesso Restrito</span>
           </div>
        )}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <GlassCard className="p-4 sm:p-6 border-l-2 sm:border-l-4 border-indigo-500 bg-indigo-500/5">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Insumos</p>
          <p className="text-2xl sm:text-4xl font-black text-white mt-1 tabular-nums">{data.unitToners.reduce((a, b) => a + b.quantity, 0)}</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6 border-l-2 sm:border-l-4 border-red-500 bg-red-500/5">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Críticos</p>
          <p className="text-2xl sm:text-4xl font-black text-white mt-1 tabular-nums">{data.unitToners.filter(ut => ut.quantity <= ut.minStockAlert).length}</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6 border-l-2 sm:border-l-4 border-yellow-500 bg-yellow-500/5">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Pedidos</p>
          <p className="text-2xl sm:text-4xl font-black text-white mt-1 tabular-nums">{data.requests.filter(r => r.status === 'PENDING').length}</p>
        </GlassCard>
        <GlassCard className="p-4 sm:p-6 border-l-2 sm:border-l-4 border-emerald-500 bg-emerald-500/5">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Unidades</p>
          <p className="text-2xl sm:text-4xl font-black text-white mt-1 tabular-nums">{data.units.length}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <GlassCard title="Níveis por Modelo">
          <div className="h-[250px] sm:h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByModel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  contentStyle={{ backgroundColor: '#13151a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} 
                />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Distribuição de Cores">
          <div className="h-[250px] sm:h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockByColor} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {stockByColor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorHex(entry.name)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#13151a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Atividade Recente" className="overflow-hidden">
        <div className="overflow-x-auto mt-4 custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 text-white/20 text-[8px] uppercase font-black tracking-[0.3em]">
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Insumo</th>
                <th className="py-4 px-6">Qtd</th>
                <th className="py-4 px-6">Origem/Destino</th>
                <th className="py-4 px-6 text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.transactions.slice(0, 6).map(tx => {
                const toner = data.toners.find(t => t.id === tx.tonerId);
                const unit = data.units.find(u => u.id === tx.unitId) || { name: 'Externa' };
                return (
                  <tr key={tx.id} className="text-xs hover:bg-white/[0.01] transition-all">
                    <td className="py-4 px-6">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${tx.type === 'ADD' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-red-500/20 text-red-400 bg-red-500/5'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white/60">{toner?.model}</td>
                    <td className="py-4 px-6 text-white/40 font-black tabular-nums">{tx.quantity}</td>
                    <td className="py-4 px-6 text-white/20 text-[9px] uppercase font-black">{unit.name}</td>
                    <td className="py-4 px-6 text-right text-white/10 text-[9px] font-medium">
                      {new Date(tx.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
