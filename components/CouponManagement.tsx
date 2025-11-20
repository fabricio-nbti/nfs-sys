
import React, { useState, useMemo } from 'react';
import { MOCK_COUPONS } from '../constants';
import { type Coupon } from '../types';
import { DataTable } from './shared/DataTable';
import Modal from './shared/Modal';
import { Plus, Edit, Trash2, Play, Pause, History, Ticket, Percent, Users, TrendingUp, Copy, Check } from 'lucide-react';

const statusColorMap: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const CouponManagement: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
    const [selection, setSelection] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
    const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // --- STATS ---
    const stats = useMemo(() => {
        const active = coupons.filter(c => c.status === 'active').length;
        const totalUsed = coupons.reduce((acc, c) => acc + c.usedCount, 0);
        const totalLimit = coupons.reduce((acc, c) => acc + c.usageLimit, 0);
        const saturation = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
        
        return { active, totalUsed, saturation };
    }, [coupons]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const columns = [
        { 
            header: 'Cupom', 
            accessor: (item: Coupon) => (
                <div className="flex items-center gap-3 group">
                    <div 
                        className="relative flex items-center justify-center px-3 py-1.5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg font-mono font-bold text-gray-700 text-sm min-w-[120px] cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all"
                        onClick={() => handleCopyCode(item.code)}
                        title="Clique para copiar"
                    >
                        {item.code}
                        {copiedCode === item.code ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md">
                                <Check size={14} />
                            </div>
                        ) : (
                            <Copy size={12} className="ml-2 opacity-0 group-hover:opacity-50" />
                        )}
                    </div>
                </div>
            )
        },
        { 
            header: 'Desconto', 
            accessor: (item: Coupon) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Percent size={12} className="mr-1"/>
                    {(item.discount * 100).toFixed(0)}% OFF
                </span>
            )
        },
        { 
            header: 'Progresso de Uso', 
            accessor: (item: Coupon) => {
                const percentage = Math.min(100, (item.usedCount / item.usageLimit) * 100);
                const isFull = item.usedCount >= item.usageLimit;
                
                return (
                    <div className="w-full max-w-[160px]">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>{item.usedCount} usados</span>
                            <span>{item.usageLimit} limite</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        },
        {
          header: 'Status',
          accessor: (item: Coupon) => (
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColorMap[item.status]}`}>
               {item.status === 'active' ? (
                   <span className="flex items-center gap-1"><Play size={10} fill="currentColor"/> Ativo</span>
               ) : (
                   <span className="flex items-center gap-1"><Pause size={10} fill="currentColor"/> Pausado</span>
               )}
            </span>
          ),
        },
    ];

    const openModal = (coupon: Coupon | null) => {
        setEditingCoupon(coupon ? { ...coupon } : { code: '', discount: 0.10, status: 'active', usageLimit: 100, usedCount: 0, usageHistory: [] });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingCoupon?.code) {
            alert("O código do cupom é obrigatório.");
            return;
        }
        
        if (editingCoupon.id) {
            setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? (editingCoupon as Coupon) : c));
        } else {
            const newCoupon: Coupon = {
                ...editingCoupon,
                id: `coupon-${Date.now()}`,
                code: editingCoupon.code.toUpperCase(),
                usageHistory: [],
                usedCount: 0
            } as Coupon;
            setCoupons(prev => [newCoupon, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue: string | number = value;

        if (name === 'discount') {
            // Ensure discount is between 0 and 100
            const num = parseFloat(value);
            finalValue = isNaN(num) ? 0 : Math.min(100, Math.max(0, num)) / 100;
        } else if (name === 'usageLimit') {
            finalValue = parseInt(value, 10);
        } else if (name === 'code') {
            finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }

        setEditingCoupon(prev => prev ? { ...prev, [name]: finalValue } : null);
    };
    
    const handleToggleStatus = (id: string) => {
        setCoupons(prev => prev.map(c => c.id === id ? {...c, status: c.status === 'active' ? 'paused' : 'active'} : c));
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este cupom?")) {
            setCoupons(prev => prev.filter(c => c.id !== id));
        }
    };
    
    const openHistoryModal = (coupon: Coupon) => {
        setViewingCoupon(coupon);
        setIsHistoryModalOpen(true);
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Ticket className="text-primary" /> Gerenciamento de Cupons
                    </h1>
                    <p className="text-gray-500 mt-1">Crie e acompanhe campanhas de desconto.</p>
                </div>
                <button 
                onClick={() => openModal(null)}
                className="bg-primary text-white px-5 py-2.5 rounded-xl flex items-center hover:bg-indigo-700 transition-colors shadow-md font-medium">
                    <Plus size={20} className="mr-2" />
                    Criar Campanha
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cupons Ativos</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                        <Ticket size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total de Usos</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalUsed}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Taxa de Uso Global</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats.saturation.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable<Coupon>
                    columns={columns}
                    data={coupons}
                    selection={selection}
                    onSelectionChange={setSelection}
                    renderActions={(item) => (
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openHistoryModal(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Histórico de Uso"><History size={18} /></button>
                        <button onClick={() => handleToggleStatus(item.id)} className={`p-1.5 rounded-lg transition-colors ${item.status === 'active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={item.status === 'active' ? 'Pausar' : 'Ativar'}>
                            {item.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button onClick={() => openModal(item)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                    </div>
                    )}
                />
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon?.id ? "Editar Campanha" : "Nova Campanha"}>
                {editingCoupon && (
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Form */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código do Cupom</label>
                                <div className="relative">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="code" 
                                        value={editingCoupon.code || ''} 
                                        onChange={handleInputChange} 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent uppercase font-mono font-bold tracking-wide" 
                                        placeholder="EX: VERAO2024" 
                                        maxLength={20}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Apenas letras e números. Sem espaços.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desconto (%)</label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="number" 
                                            name="discount" 
                                            value={editingCoupon.discount ? Math.round(editingCoupon.discount * 100) : ''} 
                                            onChange={handleInputChange} 
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-bold" 
                                            placeholder="10" 
                                            min="1" 
                                            max="100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Limite de Usos</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="number" 
                                            name="usageLimit" 
                                            value={editingCoupon.usageLimit || ''} 
                                            onChange={handleInputChange} 
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                             <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">Cancelar</button>
                                <button onClick={handleSave} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md">Salvar Cupom</button>
                            </div>
                        </div>
                        
                        {/* Preview */}
                        <div className="md:w-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-4">Prévia do Cupom</p>
                            
                            <div className="w-full bg-white border-2 border-indigo-100 rounded-xl shadow-sm overflow-hidden relative">
                                <div className="h-2 bg-primary w-full"></div>
                                <div className="p-5 text-center">
                                    <span className="inline-block p-2 bg-indigo-50 text-primary rounded-full mb-2">
                                        <Ticket size={24} />
                                    </span>
                                    <h3 className="text-2xl font-extrabold text-gray-800 mb-1">
                                        {(editingCoupon.discount ? editingCoupon.discount * 100 : 0)}% OFF
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4">Aproveite o desconto!</p>
                                    
                                    <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-2 font-mono font-bold text-gray-700 tracking-wider text-sm">
                                        {editingCoupon.code || 'SEUCODIGO'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400">Válido para os primeiros {editingCoupon.usageLimit || 100} clientes</p>
                                </div>
                                {/* Decorative circles */}
                                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-gray-50 rounded-full"></div>
                                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-gray-50 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* History Modal */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Histórico de Uso: ${viewingCoupon?.code}`}>
                {viewingCoupon && (
                    <div className="max-h-96 overflow-y-auto pr-2">
                        {viewingCoupon.usageHistory.length > 0 ? (
                             <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Data</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {viewingCoupon.usageHistory.map((use, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{use.customerName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{use.document}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{new Date(use.usedAt).toLocaleString('pt-BR')}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <History size={48} className="mb-3 opacity-20"/>
                                <p>Nenhum uso registrado para este cupom ainda.</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CouponManagement;
