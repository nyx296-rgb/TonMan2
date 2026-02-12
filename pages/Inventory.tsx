
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService';
import { GlassCard } from '../components/GlassCard';
import { User, TransactionType, Unit, Toner, UnitToner, UserRole, UnitSector, RequestStatus } from '../types';

interface InventoryProps {
  user: User | null;
}

export const Inventory: React.FC<InventoryProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [toners, setToners] = useState<Toner[]>([]);
  const [unitToners, setUnitToners] = useState<UnitToner[]>([]);
  const [sectors, setSectors] = useState<UnitSector[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');
  
  // Modais
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetItem, setTargetItem] = useState<{unitId: string, tonerId: string} | null>(null);
  
  // Campos dos Modais
  const [adjAmount, setAdjAmount] = useState(1);
  const [adjReason, setAdjReason] = useState('');
  const [reqAmount, setReqAmount] = useState(1);
  const [reqSector, setReqSector] = useState('');
  const [transferAmount, setTransferAmount] = useState(1);
  const [targetUnitId, setTargetUnitId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Perfil que pode gerenciar estoque globalmente
  const canManageStock = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPPORT;

  useEffect(() => {
    if (user?.unitId && !canManageStock) setSelectedUnit(user.unitId);
  }, [user, canManageStock]);

  const fetchData = async () => {
    setLoading(true);
    const [u, t, ut, s] = await Promise.all([
      storage.getUnits(),
      storage.getToners(),
      storage.getUnitToners(),
      storage.getUnitSectors(user?.unitId || undefined)
    ]);
    setUnits(u);
    setToners(t);
    setUnitToners(ut);
    setSectors(s);
    
    if (user?.sectorId) {
      const userSector = s.find(sec => sec.id === user.sectorId);
      if (userSector) setReqSector(userSector.name);
      else if (s.length > 0) setReqSector(s[0].name);
    } else if (s.length > 0) {
      setReqSector(s[0].name);
    }
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredItems = unitToners.filter(ut => {
    const toner = toners.find(t => t.id === ut.tonerId);
    const unit = units.find(u => u.id === ut.unitId);
    const matchesSearch = toner?.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         unit?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const effectiveSelectedUnit = canManageStock ? selectedUnit : user?.unitId;
    const matchesUnit = effectiveSelectedUnit === 'all' || ut.unitId === effectiveSelectedUnit;
    return matchesSearch && matchesUnit;
  });

  const handleAdjust = async () => {
    if (targetItem && user) {
      setIsSaving(true);
      await storage.updateStock(targetItem.unitId, targetItem.tonerId, adjAmount, user.id, adjAmount > 0 ? TransactionType.ADD : TransactionType.REMOVE, adjReason || 'Ajuste manual');
      await fetchData();
      setIsSaving(false);
      setShowAdjustmentModal(false);
      setAdjReason('');
      setAdjAmount(1);
    }
  };

  const handleRequest = async () => {
    if (targetItem && user) {
      setIsSaving(true);
      await storage.createRequest({
        tonerId: targetItem.tonerId,
        unitId: targetItem.unitId,
        quantity: reqAmount,
        sectorName: reqSector,
        requestorId: user.id
      });
      setIsSaving(false);
      setShowRequestModal(false);
      alert('Solicitação enviada com sucesso! Aguarde a aprovação do Administrador.');
    }
  };

  const handleTransfer = async () => {
    if (targetItem && targetUnitId && user) {
      if (targetItem.unitId === targetUnitId) {
        alert("A unidade de destino não pode ser a mesma de origem.");
        return;
      }
      setIsSaving(true);
      const success = await storage.transferStock(targetItem.unitId, targetUnitId, targetItem.tonerId, transferAmount, user.id);
      if (success) {
        await fetchData();
        setShowTransferModal(false);
        setTransferAmount(1);
        setTargetUnitId('');
      } else {
        alert("Falha na transferência. Verifique se há saldo suficiente.");
      }
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="text-white/20 font-black uppercase tracking-widest text-[10px]">Lendo Inventário...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tighter italic uppercase">Estoque Operacional</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
            {canManageStock && selectedUnit === 'all' ? 'Consolidado Global de Ativos' : `Unidade: ${units.find(u => u.id === (canManageStock ? selectedUnit : user?.unitId))?.name || 'Local'}`}
          </p>
        </div>
        <div className="flex gap-3">
          {canManageStock && (
            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="all" className="bg-[#1a1c2c]">Todas Unidades</option>
              {units.map(u => <option key={u.id} value={u.id} className="bg-[#1a1c2c]">{u.name}</option>)}
            </select>
          )}
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors">🔍</span>
            <input type="text" placeholder="Filtrar por modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[280px] shadow-inner transition-all" />
          </div>
        </div>
      </header>

      <GlassCard className="overflow-hidden border-indigo-500/10 shadow-indigo-900/10 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-white/30 text-[9px] uppercase tracking-[0.2em] font-black bg-white/[0.02]">
                <th className="py-5 px-6">Local</th>
                <th className="py-5 px-6">Equipamento / Modelo</th>
                <th className="py-5 px-6">Insumo</th>
                <th className="py-5 px-6 text-center">Disponível</th>
                <th className="py-5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map(ut => {
                const toner = toners.find(t => t.id === ut.tonerId);
                const unit = units.find(u => u.id === ut.unitId);
                const isLow = ut.quantity <= ut.minStockAlert;
                return (
                  <tr key={ut.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 px-6">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{unit?.name}</span>
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-bold text-white/90 group-hover:text-white transition-colors">{toner?.model}</p>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xl" style={{ backgroundColor: toner?.color === 'Ciano' ? '#06b6d4' : toner?.color === 'Magenta' ? '#ec4899' : toner?.color === 'Amarelo' ? '#eab308' : '#111' }}></div>
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{toner?.color}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-2xl font-black tabular-nums transition-colors duration-500 ${isLow ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                          {ut.quantity}
                        </span>
                        {isLow && <span className="text-[7px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-red-500/20 mt-1">Nível Crítico</span>}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right space-x-2">
                      {canManageStock ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setTargetItem({unitId: ut.unitId, tonerId: ut.tonerId}); setShowTransferModal(true); }} className="px-3 py-2 text-[8px] font-black uppercase tracking-widest bg-white/5 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-all border border-white/10">Transferir</button>
                          <button onClick={() => { setTargetItem({unitId: ut.unitId, tonerId: ut.tonerId}); setShowAdjustmentModal(true); }} className="px-3 py-2 text-[8px] font-black uppercase tracking-widest bg-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all border border-white/10">Ajustar</button>
                        </div>
                      ) : (
                        <button onClick={() => { setTargetItem({unitId: ut.unitId, tonerId: ut.tonerId}); setShowRequestModal(true); }} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all border border-indigo-500/30">Requisitar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* --- MODAIS --- */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="glass-card max-w-md w-full p-10 rounded-[2.5rem] border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <h3 className="text-2xl font-black mb-8 text-white italic uppercase tracking-tighter">Transferência de Insumo</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-white/30 mb-2 uppercase tracking-widest">Unidade de Destino</label>
                <select value={targetUnitId} onChange={(e) => setTargetUnitId(e.target.value)} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Selecione a Unidade</option>
                  {units.filter(u => u.id !== targetItem?.unitId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-white/30 mb-2 uppercase tracking-widest">Quantidade</label>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button onClick={() => setTransferAmount(Math.max(1, transferAmount - 1))} className="w-12 h-12 rounded-xl border border-white/10 hover:bg-white/10 text-white text-xl">-</button>
                  <input type="number" value={transferAmount} readOnly className="flex-1 bg-transparent border-none text-center text-2xl font-black text-white" />
                  <button onClick={() => setTransferAmount(transferAmount + 1)} className="w-12 h-12 rounded-xl border border-white/10 hover:bg-white/10 text-white text-xl">+</button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button disabled={isSaving} onClick={() => setShowTransferModal(false)} className="flex-1 py-5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">Voltar</button>
                <button disabled={isSaving || !targetUnitId} onClick={handleTransfer} className="flex-1 py-5 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-card max-w-md w-full p-10 rounded-[2.5rem] border-2 border-indigo-500/20 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black mb-6 text-white italic flex items-center gap-3 uppercase tracking-widest">Requisição Interna</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-white/30 mb-2 uppercase tracking-widest">Setor do Pedido</label>
                <select 
                  value={reqSector}
                  onChange={(e) => setReqSector(e.target.value)}
                  className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white"
                >
                  {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-white/30 mb-2 uppercase tracking-widest">Qtd. Solicitada</label>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-inner">
                  <button onClick={() => setReqAmount(Math.max(1, reqAmount - 1))} className="w-12 h-12 rounded-xl border border-white/10 hover:bg-white/10 font-bold text-white transition-all text-xl">-</button>
                  <input type="number" value={reqAmount} readOnly className="flex-1 bg-transparent border-none text-center text-2xl font-black text-white outline-none" />
                  <button onClick={() => setReqAmount(reqAmount + 1)} className="w-12 h-12 rounded-xl border border-white/10 hover:bg-white/10 font-bold text-white transition-all text-xl">+</button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button disabled={isSaving} onClick={() => setShowRequestModal(false)} className="flex-1 px-6 py-4 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Sair</button>
                <button disabled={isSaving} onClick={handleRequest} className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-900/60 transition-all transform active:scale-95">
                  {isSaving ? 'Gravando...' : 'Enviar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-card max-w-md w-full p-10 rounded-[2.5rem] border-2 border-indigo-500/20 shadow-2xl relative">
            <h3 className="text-xl font-black mb-6 text-white italic uppercase">Ajuste de Saldo</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-white/30 mb-2 uppercase tracking-widest">Incremento / Decremento</label>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button onClick={() => setAdjAmount(prev => prev - 1)} className="w-12 h-12 rounded-xl border border-white/10 hover:bg-white/10 text-white text-xl">-</button>
                  <input type="number" value={adjAmount} onChange={(e) => setAdjAmount(parseInt(e.target.value) || 0)} className="flex-1 bg-transparent border-none text-center text-2xl font-black text-white outline-none" />
                  <button onClick={() => setAdjAmount(prev => prev + 1)} className="w-12 h-12 rounded-xl border border-white/10 hover:bg-white/10 text-white text-xl">+</button>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-white/30 mb-2 uppercase tracking-widest">Justificativa (Auditoria)</label>
                <textarea value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Descreva o motivo..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 h-28 outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <button disabled={isSaving} onClick={() => setShowAdjustmentModal(false)} className="flex-1 px-6 py-4 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancelar</button>
                <button disabled={isSaving} onClick={handleAdjust} className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-900/60 transition-all transform active:scale-95">Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
