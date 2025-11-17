import React, { useState } from 'react';
import { MOCK_COUPONS } from '../constants';
import { type Coupon } from '../types';
import { DataTable } from './shared/DataTable';
import Modal from './shared/Modal';
import { Plus, Edit, Trash2, Play, Pause, History } from 'lucide-react';

const statusColorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
};

const CouponManagement: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
    const [selection, setSelection] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
    const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);

    const columns = [
        { header: 'Código', accessor: 'code' as keyof Coupon },
        { 
            header: 'Desconto', 
            accessor: (item: Coupon) => `${item.discount * 100}%`
        },
        { 
            header: 'Uso', 
            accessor: (item: Coupon) => `${item.usedCount} / ${item.usageLimit}` 
        },
        {
          header: 'Status',
          accessor: (item: Coupon) => (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[item.status]}`}>
              {item.status === 'active' ? 'Ativo' : 'Pausado'}
            </span>
          ),
        },
    ];

    const openModal = (coupon: Coupon | null) => {
        setEditingCoupon(coupon ? { ...coupon } : { code: '', discount: 0.10, status: 'active', usageLimit: 1, usedCount: 0, usageHistory: [] });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingCoupon) return;
        
        if (editingCoupon.id) {
            setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? (editingCoupon as Coupon) : c));
        } else {
            const newCoupon: Coupon = {
                ...editingCoupon,
                id: `coupon-${Date.now()}`,
                code: editingCoupon.code?.toUpperCase() || '',
            } as Coupon;
            setCoupons(prev => [newCoupon, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue: string | number = value;

        if (name === 'discount') {
            finalValue = parseFloat(value) / 100;
        } else if (name === 'usageLimit') {
            finalValue = parseInt(value, 10);
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Cupons</h1>
                <button 
                onClick={() => openModal(null)}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                <Plus size={20} className="mr-2" />
                Novo Cupom
                </button>
            </div>

            <DataTable<Coupon>
                columns={columns}
                data={coupons}
                selection={selection}
                onSelectionChange={setSelection}
                renderActions={(item) => (
                <div className="flex space-x-3">
                    <button onClick={() => openHistoryModal(item)} className="text-blue-600 hover:text-blue-900" title="Histórico de Uso"><History size={18} /></button>
                    <button onClick={() => handleToggleStatus(item.id)} className="text-gray-600 hover:text-gray-900" title={item.status === 'active' ? 'Pausar' : 'Ativar'}>
                        {item.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={() => openModal(item)} className="text-yellow-600 hover:text-yellow-900" title="Editar"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 size={18} /></button>
                </div>
                )}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon?.id ? "Editar Cupom" : "Adicionar Novo Cupom"}>
                {editingCoupon && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Código</label>
                            <input type="text" name="code" value={editingCoupon.code || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md uppercase" placeholder="EX: PRIMEOFF10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Desconto (%)</label>
                                <input type="number" name="discount" value={(editingCoupon.discount || 0) * 100} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" placeholder="10" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Limite de Usos</label>
                                <input type="number" name="usageLimit" value={editingCoupon.usageLimit || 1} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" />
                            </div>
                        </div>
                         <div className="mt-6 flex justify-end">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                            <button type="button" onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Histórico de Uso - Cupom: ${viewingCoupon?.code}`}>
                {viewingCoupon && (
                    <div className="max-h-96 overflow-y-auto">
                        {viewingCoupon.usageHistory.length > 0 ? (
                             <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {viewingCoupon.usageHistory.map((use, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-gray-800">{use.customerName}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{use.document}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{new Date(use.usedAt).toLocaleString('pt-BR')}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-4">Nenhum uso registrado para este cupom.</p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CouponManagement;
