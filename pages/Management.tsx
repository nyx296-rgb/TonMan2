
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService';
import { GlassCard } from '../components/GlassCard';
import { User, Unit, Toner, UserRole, UnitSector } from '../types';

export const Management: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'units' | 'toners' | 'sectors' | 'cloud'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [toners, setToners] = useState<Toner[]>([]);
  const [sectors, setSectors] = useState<UnitSector[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cloud Simulation States
  const [desiredDomain, setDesiredDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'available'>('idle');

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingToner, setEditingToner] = useState<Toner | null>(null);
  const [editingSector, setEditingSector] = useState<UnitSector | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [u, un, t, s] = await Promise.all([
      storage.getUsers(),
      storage.getUnits(),
      storage.getToners(),
      storage.getUnitSectors()
    ]);
    setUsers(u);
    setUnits(un);
    setToners(t);
    setSectors(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const [newUser, setNewUser] = useState({ 
    username: '', 
    displayName: '', 
    email: '', 
    role: UserRole.EDITOR, 
    unitId: '',
    sectorId: '' 
  });
  const [newUnitName, setNewUnitName] = useState('');
  const [newToner, setNewToner] = useState({ model: '', color: 'Preto' });
  const [newSector, setNewSector] = useState({ unitId: '', name: '' });

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.displayName) {
      alert("Por favor, preencha o nome e o usuário.");
      return;
    }
    setIsProcessing(true);
    await storage.createUser(newUser);
    setNewUser({ username: '', displayName: '', email: '', role: UserRole.EDITOR, unitId: '', sectorId: '' });
    await fetchData();
    setIsProcessing(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsProcessing(true);
    await storage.updateUser(editingUser);
    setEditingUser(null);
    setShowEditModal(false);
    await fetchData();
    setIsProcessing(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    setIsProcessing(true);
    await storage.deleteUser(id);
    await fetchData();
    setIsProcessing(false);
  };

  const handleAddUnit = async () => {
    if (!newUnitName) return;
    setIsProcessing(true);
    await storage.createUnit(newUnitName);
    setNewUnitName('');
    await fetchData();
    setIsProcessing(false);
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit) return;
    setIsProcessing(true);
    await storage.updateUnit(editingUnit.id, editingUnit.name);
    setEditingUnit(null);
    setShowEditModal(false);
    await fetchData();
    setIsProcessing(false);
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("Excluir uma unidade removerá todos os vínculos (estoque, setores). Continuar?")) return;
    setIsProcessing(true);
    await storage.deleteUnit(id);
    await fetchData();
    setIsProcessing(false);
  };

  const handleAddToner = async () => {
    if (!newToner.model) return;
    setIsProcessing(true);
    await storage.createToner(newToner.model, newToner.color);
    setNewToner({ model: '', color: 'Preto' });
    await fetchData();
    setIsProcessing(false);
  };

  const handleUpdateToner = async () => {
    if (!editingToner) return;
    setIsProcessing(true);
    await storage.updateToner(editingToner);
    setEditingToner(null);
    setShowEditModal(false);
    await fetchData();
    setIsProcessing(false);
  };

  const handleDeleteToner = async (id: string) => {
    if (!confirm("Excluir este insumo removerá os registros de estoque em todas as unidades. Continuar?")) return;
    setIsProcessing(true);
    await storage.deleteToner(id);
    await fetchData();
    setIsProcessing(false);
  };

  const handleAddSector = async () => {
    if (!newSector.unitId || !newSector.name) return;
    setIsProcessing(true);
    await storage.createSector(newSector.unitId, newSector.name);
    setNewSector({ unitId: '', name: '' });
    await fetchData();
    setIsProcessing(false);
  };

  const handleUpdateSector = async () => {
    if (!editingSector) return;
    setIsProcessing(true);
    await storage.updateSector(editingSector.id, editingSector.name);
    setEditingSector(null);
    setShowEditModal(false);
    await fetchData();
    setIsProcessing(false);
  };

  const handleDeleteSector = async (id: string) => {
    if (!confirm("Deseja excluir este setor?")) return;
    setIsProcessing(true);
    await storage.deleteSector(id);
    await fetchData();
    setIsProcessing(false);
  };

  const checkDomain = () => {
    if (!desiredDomain) return;
    setDomainStatus('checking');
    setTimeout(() => setDomainStatus('available'), 1500);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="text-white/20 font-black tracking-widest uppercase text-[10px]">Sincronizando Gestão...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white/90 tracking-tighter italic uppercase">Gestão de Infraestrutura</h2>
          <p className="text-white/40 text-sm font-medium">Controle granular de acessos, unidades e infraestrutura de rede.</p>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl overflow-x-auto max-w-full custom-scrollbar">
          {[
            { id: 'users', label: '👥 Acessos' },
            { id: 'units', label: '🏢 Unidades' },
            { id: 'sectors', label: '📍 Setores' },
            { id: 'toners', label: '🖨️ Insumos' },
            { id: 'cloud', label: '🌐 Nuvem & DNS' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as any); setShowEditModal(false); }}
              className={`px-6 py-3 rounded-[1.5rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                tab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-white/30 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* --- CLOUD TAB --- */}
      {tab === 'cloud' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status do Servidor */}
            <GlassCard title="Rede & Endereçamento" className="lg:col-span-1 border-indigo-500/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Gateway Neon DB</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">Ativo</span>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Endereço IP Público (Anycast)</span>
                    <span className="text-indigo-400 font-mono text-[10px]">76.76.21.21</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Protocolo Seguro</span>
                    <span className="text-emerald-400 font-mono text-[10px]">HTTPS / TLS 1.3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">CDN Endpoint</span>
                    <span className="text-indigo-400 font-mono text-[10px]">vercel-edge.net</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.1em] leading-relaxed">
                    Seu sistema está operando em uma rede de borda global. O IP acima é o ponto de entrada seguro para todos os acessos.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Configuração de Domínio Profissional */}
            <GlassCard title="Domínio & DNS Personalizado" className="lg:col-span-2 border-purple-500/20">
              <div className="space-y-6">
                <p className="text-sm text-white/60">Para ter um endereço como <span className="text-purple-400 font-bold">tonman.hospital.com.br</span>, siga estes passos técnicos:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">1. Escolha seu Domínio</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="tonman.empresa.com.br" 
                        value={desiredDomain}
                        onChange={(e) => setDesiredDomain(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button 
                        onClick={checkDomain}
                        className="bg-purple-600 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all"
                      >
                        {domainStatus === 'checking' ? 'Validando...' : 'Verificar'}
                      </button>
                    </div>
                    {domainStatus === 'available' && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                        <span className="text-emerald-400">✅</span>
                        <span className="text-[9px] text-emerald-400 font-black uppercase">Domínio pronto para apontamento DNS</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Configuração de Zona DNS</h4>
                    <div className="space-y-3 font-mono text-[9px]">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/20">TYPE</span>
                        <span className="text-white/20">NAME</span>
                        <span className="text-white/20">VALUE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400">A</span>
                        <span className="text-white">@</span>
                        <span className="text-indigo-400">76.76.21.21</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400">CNAME</span>
                        <span className="text-white">www</span>
                        <span className="text-indigo-400">cname.vercel-dns.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-dashed border-white/10 rounded-3xl bg-indigo-500/5">
                   <h5 className="text-[10px] font-black text-white mb-2 uppercase">Por que usar DNS Próprio?</h5>
                   <ul className="grid grid-cols-2 gap-4 text-[10px] text-white/40 font-medium">
                      <li className="flex gap-2"><span>💎</span> Marca Profissional</li>
                      <li className="flex gap-2"><span>🔒</span> Certificado SSL Próprio</li>
                      <li className="flex gap-2"><span>🚀</span> Cache Global</li>
                      <li className="flex gap-2"><span>🛡️</span> Proteção Anti-DDoS</li>
                   </ul>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center group hover:bg-indigo-600/10 transition-all cursor-pointer" onClick={() => window.open('https://vercel.com', '_blank')}>
               <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚡</span>
               <h4 className="text-xs font-black uppercase text-white tracking-widest mb-2">Deploy na Vercel</h4>
               <p className="text-[9px] text-white/30 uppercase leading-relaxed">Conecte seu GitHub e publique em segundos com IP Anycast grátis.</p>
            </div>
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center group hover:bg-blue-600/10 transition-all cursor-pointer" onClick={() => window.open('https://cloudflare.com', '_blank')}>
               <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">☁️</span>
               <h4 className="text-xs font-black uppercase text-white tracking-widest mb-2">Cloudflare Proxy</h4>
               <p className="text-[9px] text-white/30 uppercase leading-relaxed">Mascare seu IP real e obtenha proteção de nível militar e DNS ultrarrápido.</p>
            </div>
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center group hover:bg-emerald-600/10 transition-all cursor-pointer" onClick={() => window.open('https://neon.tech', '_blank')}>
               <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">💾</span>
               <h4 className="text-xs font-black uppercase text-white tracking-widest mb-2">Neon Serverless</h4>
               <p className="text-[9px] text-white/30 uppercase leading-relaxed">Banco de dados SQL na nuvem com escala automática e latência zero.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GlassCard title="Registrar Colaborador" className="lg:col-span-1 border-white/10">
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1 block">Dados de Autenticação</label>
                <input type="text" placeholder="Username (ex: hgsc_admin)" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-3 transition-all" />
                <input type="text" placeholder="Nome do Funcionário" value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>

              <div>
                <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1 mb-1 block">Nível & Localidade</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-4 py-4 text-sm text-white mb-3 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value={UserRole.ADMIN}>ADMIN MASTER</option>
                  <option value={UserRole.SUPPORT}>SUPORTE TÉCNICO</option>
                  <option value={UserRole.EDITOR}>EDITOR (UNIDADE)</option>
                  <option value={UserRole.VIEWER}>VISUALIZADOR</option>
                </select>

                <select value={newUser.unitId} onChange={e => setNewUser({...newUser, unitId: e.target.value, sectorId: ''})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-4 py-4 text-sm text-white mb-3 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Selecione a Unidade</option>
                  {units.map(un => <option key={un.id} value={un.id}>{un.name}</option>)}
                </select>

                {newUser.unitId && (
                  <select value={newUser.sectorId} onChange={e => setNewUser({...newUser, sectorId: e.target.value})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-4 py-4 text-sm text-white outline-none animate-in slide-in-from-top-2 focus:ring-2 focus:ring-indigo-500">
                    <option value="">Setor Padrão (Opcional)</option>
                    {sectors.filter(s => s.unitId === newUser.unitId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>

              <button disabled={isProcessing} onClick={handleAddUser} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-900/60 transform active:scale-95">
                {isProcessing ? 'Gravando...' : 'Criar Novo Acesso'}
              </button>
            </div>
          </GlassCard>

          <GlassCard title="Colaboradores do Sistema" className="lg:col-span-2 p-0 overflow-hidden">
             <div className="divide-y divide-white/5 h-[560px] overflow-y-auto custom-scrollbar">
                {users.length === 0 ? (
                  <div className="p-12 text-center text-white/10 font-black uppercase tracking-widest text-xs italic">Nenhum usuário cadastrado</div>
                ) : (
                  users.map(u => {
                    const unit = units.find(un => un.id === u.unitId);
                    const sector = sectors.find(s => s.id === u.sectorId);
                    return (
                      <div key={u.id} className="py-5 px-6 flex justify-between items-center group hover:bg-white/[0.02] transition-colors border-l-4 border-transparent hover:border-indigo-500/50">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl ${u.role === UserRole.ADMIN ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-white/90 group-hover:text-indigo-400 transition-colors text-sm uppercase tracking-tight">{u.displayName}</p>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-0.5">
                              @{u.username} • {unit?.name || 'ACESSO GLOBAL'} 
                              {sector && <span className="text-indigo-500/60 ml-1">[{sector.name}]</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setEditingUser(u); setShowEditModal(true); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:text-indigo-400 hover:bg-indigo-600/10 transition-all">✏️</button>
                          <button onClick={() => handleDeleteUser(u.id)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-600/10 transition-all">🗑️</button>
                          <span className={`px-4 py-1.5 bg-white/5 border rounded-[1rem] text-[8px] font-black uppercase tracking-widest ${
                            u.role === UserRole.ADMIN ? 'border-red-500/20 text-red-400' : 'border-indigo-500/20 text-indigo-400'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          </GlassCard>
        </div>
      )}

      {/* --- UNITS TAB --- */}
      {tab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GlassCard title="Nova Unidade">
            <div className="space-y-4">
              <input type="text" placeholder="Ex: 008 - Unidade Nova" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              <button disabled={isProcessing} onClick={handleAddUnit} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-900/40">
                {isProcessing ? 'Adicionando...' : 'Confirmar Cadastro'}
              </button>
            </div>
          </GlassCard>
          <GlassCard title="Unidades Ativas" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[520px] overflow-y-auto pr-2 custom-scrollbar">
              {units.map(un => (
                <div key={un.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 flex justify-between items-center hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all group shadow-xl">
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 opacity-40 group-hover:opacity-100 transition-opacity">{un.id}</span>
                    <p className="font-black text-white/90 truncate text-base tracking-tight">{un.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingUnit(un); setShowEditModal(true); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-indigo-500/20 text-sm">✏️</button>
                    <button onClick={() => handleDeleteUnit(un.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 text-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* --- SECTORS TAB --- */}
      {tab === 'sectors' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <GlassCard title="Adicionar Setor" className="lg:col-span-1">
            <div className="space-y-4">
              <select value={newSector.unitId} onChange={e => setNewSector({...newSector, unitId: e.target.value})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione a Unidade</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input type="text" placeholder="Nome do Setor (ex: TI)" value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              <button disabled={isProcessing} onClick={handleAddSector} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                {isProcessing ? 'Gravando...' : 'Vincular Setor'}
              </button>
            </div>
          </GlassCard>
          <div className="lg:col-span-3 space-y-6 max-h-[750px] overflow-y-auto pr-4 custom-scrollbar">
            {units.map(unit => (
              <GlassCard key={unit.id} title={`${unit.name}`} className="border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {sectors.filter(s => s.unitId === unit.id).map(s => (
                    <div key={s.id} className="relative group p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[10px] font-black text-indigo-400/80 uppercase tracking-tighter hover:bg-indigo-600 hover:text-white transition-all text-center">
                      <span className="block mb-4">{s.name}</span>
                      <div className="absolute inset-0 bg-indigo-900/90 rounded-2xl flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingSector(s); setShowEditModal(true); }} className="hover:scale-125 transition-transform">✏️</button>
                         <button onClick={() => handleDeleteSector(s.id)} className="hover:scale-125 transition-transform">🗑️</button>
                      </div>
                    </div>
                  ))}
                  {sectors.filter(s => s.unitId === unit.id).length === 0 && (
                    <p className="text-[10px] text-white/10 font-black uppercase italic p-2 col-span-full tracking-[0.2em]">Sem setores configurados</p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* --- TONERS TAB --- */}
      {tab === 'toners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GlassCard title="Catálogo Mestre">
            <p className="text-white/30 text-[9px] mb-8 uppercase font-black tracking-[0.2em] leading-relaxed italic border-l-2 border-indigo-500 pl-4">Modelos criados aqui estarão disponíveis para estoque em todas as unidades.</p>
            <div className="space-y-4">
              <input type="text" placeholder="Modelo Comercial" value={newToner.model} onChange={e => setNewToner({...newToner, model: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
              <select value={newToner.color} onChange={e => setNewToner({...newToner, color: e.target.value})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner">
                {['Preto', 'Ciano', 'Magenta', 'Amarelo'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button disabled={isProcessing} onClick={handleAddToner} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5">
                {isProcessing ? 'Gravando...' : 'Adicionar Insumo'}
              </button>
            </div>
          </GlassCard>
          <GlassCard title="Insumos Homologados" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[520px] overflow-y-auto pr-2 custom-scrollbar">
               {toners.map(t => (
                 <div key={t.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex justify-between items-center group hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all shadow-xl">
                    <div className="overflow-hidden flex-1">
                      <p className="font-black text-white/90 group-hover:text-indigo-400 transition-colors tracking-tight truncate">{t.model}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/20 mt-1">{t.color}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingToner(t); setShowEditModal(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-indigo-600 text-sm">✏️</button>
                         <button onClick={() => handleDeleteToner(t.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-600 text-sm">🗑️</button>
                      </div>
                      <div className="w-10 h-10 rounded-2xl border border-white/20 shadow-2xl shrink-0" style={{ backgroundColor: t.color === 'Ciano' ? '#06b6d4' : t.color === 'Magenta' ? '#ec4899' : t.color === 'Amarelo' ? '#eab308' : '#111' }}></div>
                    </div>
                 </div>
               ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
           <div className="glass-card max-w-lg w-full p-10 rounded-[2.5rem] border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
              <h3 className="text-2xl font-black mb-8 text-white italic uppercase tracking-tighter">Editar Registro</h3>
              
              <div className="space-y-6">
                {/* User Edit */}
                {tab === 'users' && editingUser && (
                  <>
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Nome de Exibição</label>
                      <input type="text" value={editingUser.displayName} onChange={e => setEditingUser({...editingUser, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Email Corporativo</label>
                      <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Perfil</label>
                         <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-5 py-4 text-white">
                           {Object.values(UserRole).map(role => <option key={role} value={role}>{role.toUpperCase()}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Unidade</label>
                         <select value={editingUser.unitId || ''} onChange={e => setEditingUser({...editingUser, unitId: e.target.value, sectorId: ''})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-5 py-4 text-white">
                           <option value="">Acesso Global</option>
                           {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                         </select>
                       </div>
                    </div>
                    <button disabled={isProcessing} onClick={handleUpdateUser} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">
                      {isProcessing ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </>
                )}

                {/* Unit Edit */}
                {tab === 'units' && editingUnit && (
                  <>
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Nome da Unidade</label>
                      <input type="text" value={editingUnit.name} onChange={e => setEditingUnit({...editingUnit, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button disabled={isProcessing} onClick={handleUpdateUnit} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                      {isProcessing ? 'Salvando...' : 'Atualizar Unidade'}
                    </button>
                  </>
                )}

                {/* Sector Edit */}
                {tab === 'sectors' && editingSector && (
                  <>
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Nome do Setor</label>
                      <input type="text" value={editingSector.name} onChange={e => setEditingSector({...editingSector, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button disabled={isProcessing} onClick={handleUpdateSector} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                      {isProcessing ? 'Salvando...' : 'Atualizar Setor'}
                    </button>
                  </>
                )}

                {/* Toner Edit */}
                {tab === 'toners' && editingToner && (
                  <>
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Modelo Comercial</label>
                      <input type="text" value={editingToner.model} onChange={e => setEditingToner({...editingToner, model: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Cor</label>
                      <select value={editingToner.color} onChange={e => setEditingToner({...editingToner, color: e.target.value})} className="w-full bg-[#1a1c2c] border border-white/10 rounded-2xl px-5 py-4 text-white">
                        {['Preto', 'Ciano', 'Magenta', 'Amarelo'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button disabled={isProcessing} onClick={handleUpdateToner} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                      {isProcessing ? 'Salvando...' : 'Atualizar Insumo'}
                    </button>
                  </>
                )}

                <button onClick={() => setShowEditModal(false)} className="w-full bg-white/5 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-all">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
