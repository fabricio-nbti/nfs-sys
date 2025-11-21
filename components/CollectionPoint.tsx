
import React, { useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { PackageCheck, DollarSign, PackageMinus, History, Plus, Pencil, Trash2, Box, Tag, Scroll, FileDown, Printer, Save } from 'lucide-react';
import { DataTable } from './shared/DataTable';
import Modal from './shared/Modal';
import { type CollectionPointItem, type CollectionTransaction } from '../types';

// Mock initial data for this specific module
const INITIAL_ITEMS: CollectionPointItem[] = [
    { id: '1', name: 'Envelope de Segurança P', type: 'packaging', size: '19x25', price: 0.50, cost: 0.20, stock: 500 },
    { id: '2', name: 'Envelope de Segurança M', type: 'packaging', size: '26x36', price: 0.80, cost: 0.35, stock: 350 },
    { id: '3', name: 'Envelope de Segurança G', type: 'packaging', size: '32x40', price: 1.20, cost: 0.50, stock: 200 },
    { id: '4', name: 'Caixa de Papelão Padrão', type: 'packaging', size: '20x20x15', price: 2.50, cost: 1.10, stock: 100 },
    { id: '5', name: 'Rolo de Fita Adesiva Transparente', type: 'tape', price: 6.00, cost: 2.50, stock: 40 },
    { id: '6', name: 'Etiqueta Adesiva (A4)', type: 'label', price: 0.50, cost: 0.10, stock: 1000 },
];

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const CollectionPoint: React.FC = () => {
    const [items, setItems] = useState<CollectionPointItem[]>(INITIAL_ITEMS);
    const [transactions, setTransactions] = useState<CollectionTransaction[]>([]);
    const [activeTab, setActiveTab] = useState<'sales' | 'manage'>('sales');
    
    // Management Modal State (For Edits)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<CollectionPointItem> | null>(null);
    const [selection, setSelection] = useState<string[]>([]);
    
    // New Item Form State
    const [newItemData, setNewItemData] = useState({
        name: '',
        type: 'packaging',
        size: '',
        stock: '',
        cost: '',
        price: ''
    });
    
    // Printing State
    const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);

    // --- LOGIC ---

    const handleTransaction = (item: CollectionPointItem, type: 'sale' | 'internal_use', qty: number) => {
        if (item.stock < qty) {
            alert('Estoque insuficiente!');
            return;
        }

        // Update Stock
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: i.stock - qty } : i));

        // Record Transaction
        const newTransaction: CollectionTransaction = {
            id: `trx-${Date.now()}`,
            date: new Date().toLocaleString('pt-BR'),
            itemId: item.id,
            itemName: item.name,
            type,
            quantity: qty,
            unitValue: type === 'sale' ? item.price : item.cost,
            totalValue: (type === 'sale' ? item.price : item.cost) * qty
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemData.name) {
            alert("O nome do item é obrigatório.");
            return;
        }

        const newItem: CollectionPointItem = {
            id: `cp-${Date.now()}`,
            name: newItemData.name,
            type: newItemData.type as any,
            size: newItemData.size,
            stock: Number(newItemData.stock) || 0,
            cost: Number(newItemData.cost) || 0,
            price: Number(newItemData.price) || 0
        };
        
        setItems(prev => [newItem, ...prev]);
        setNewItemData({ name: '', type: 'packaging', size: '', stock: '', cost: '', price: '' });
        alert("Item cadastrado com sucesso!");
    };

    const handleSaveEditItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem?.name || !editingItem.type) return;

        if (editingItem.id) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? editingItem as CollectionPointItem : i));
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (id: string) => {
        if(window.confirm("Tem certeza?")) setItems(prev => prev.filter(i => i.id !== id));
    };

    // --- EXPORT & PRINT HANDLERS ---
    const exportToCSV = (data: any[], filename: string, headers: string[]) => {
        const csvContent = [
            headers.join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportItemsCSV = () => {
        const data = items.map(item => ({
            Nome: item.name,
            Tipo: item.type,
            Tamanho: item.size || '-',
            Custo: item.cost.toFixed(2),
            PrecoVenda: item.price.toFixed(2),
            Estoque: item.stock
        }));
        exportToCSV(data, 'estoque_ponto_coleta', ['Nome', 'Tipo', 'Tamanho', 'Custo', 'Preco Venda', 'Estoque']);
    };

    const handleExportTransactionsCSV = () => {
        const data = transactions.map(t => ({
            Data: t.date,
            Item: t.itemName,
            Tipo: t.type === 'sale' ? 'Venda' : 'Uso Interno',
            Qtd: t.quantity,
            ValorTotal: t.totalValue.toFixed(2)
        }));
        exportToCSV(data, 'historico_transacoes_coleta', ['Data', 'Item', 'Tipo', 'Quantidade', 'Valor Total']);
    };

    const handlePrintTable = (title: string, columns: any[], data: any[]) => {
        const content = (
            <div className="p-8 font-sans">
                <h1 className="text-2xl font-bold mb-2 text-center">{title}</h1>
                <p className="text-center text-sm text-gray-500 mb-6">Gerado em {new Date().toLocaleString('pt-BR')}</p>
                
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {columns.map((col: any, i: number) => (
                                <th key={i} className="border border-gray-300 p-2 text-left">{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item: any, i: number) => (
                            <tr key={i}>
                                {columns.map((col: any, j: number) => (
                                    <td key={j} className="border border-gray-300 p-2">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        flushSync(() => {
            setPrintableContent(content);
        });
        window.print();
        setPrintableContent(null);
    };

    // --- DERIVED DATA ---
    const todaysTransactions = transactions.filter(t => t.date.includes(new Date().toLocaleDateString('pt-BR')));
    const totalSalesToday = todaysTransactions.filter(t => t.type === 'sale').reduce((acc, t) => acc + t.totalValue, 0);
    const totalUsageCostToday = todaysTransactions.filter(t => t.type === 'internal_use').reduce((acc, t) => acc + t.totalValue, 0);


    // --- ICONS HELPER ---
    const getItemIcon = (type: string) => {
        switch(type) {
            case 'tape': return <Scroll size={24} className="text-amber-500" />;
            case 'label': return <Tag size={24} className="text-indigo-500" />;
            default: return <Box size={24} className="text-blue-500" />;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-3xl font-bold text-gray-800">Ponto de Coleta - Vendas e Insumos</h1>
                <div className="flex bg-gray-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('sales')} 
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'sales' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        Vendas e Uso
                    </button>
                    <button 
                         onClick={() => setActiveTab('manage')} 
                         className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'manage' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        Gerenciar Estoque
                    </button>
                </div>
            </div>

            {/* KPI SUMMARY (Always Visible) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Vendas Hoje</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSalesToday)}</p>
                    </div>
                    <DollarSign className="text-green-200 w-10 h-10" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-400 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Custo de Uso Interno (Hoje)</p>
                        <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalUsageCostToday)}</p>
                    </div>
                    <PackageMinus className="text-orange-200 w-10 h-10" />
                </div>
                 <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Movimentações (Hoje)</p>
                        <p className="text-2xl font-bold text-blue-600">{todaysTransactions.length}</p>
                    </div>
                    <History className="text-blue-200 w-10 h-10" />
                </div>
            </div>

            {/* TAB: SALES & USAGE */}
            {activeTab === 'sales' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Itens Disponíveis</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {items.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-50 p-2 rounded-full">{getItemIcon(item.type)}</div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                                                {item.size && <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">{item.size}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.stock} un
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Preço Venda:</span>
                                            <span className="font-bold text-gray-800">{formatCurrency(item.price)}</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <button 
                                                onClick={() => handleTransaction(item, 'sale', 1)}
                                                disabled={item.stock <= 0}
                                                className="bg-green-600 text-white py-2 px-2 rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                                            >
                                                <DollarSign size={14} className="mr-1"/> Vender
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleTransaction(item, 'internal_use', 1)}
                                                disabled={item.stock <= 0}
                                                className="bg-orange-500 text-white py-2 px-2 rounded text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center"
                                                title={item.type === 'tape' ? "Marcar rolo como 'em uso' no balcão" : "Consumir para embalagem"}
                                            >
                                                <PackageMinus size={14} className="mr-1"/> Uso
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">Histórico do Dia</h2>
                            <div className="flex gap-1">
                                <button onClick={handleExportTransactionsCSV} className="text-gray-600 hover:text-green-700 p-1" title="Exportar CSV">
                                    <FileDown size={18} />
                                </button>
                                <button onClick={() => handlePrintTable('Histórico de Transações do Dia', 
                                    [
                                        { header: 'Data', accessor: 'date' },
                                        { header: 'Item', accessor: 'itemName' },
                                        { header: 'Tipo', accessor: (t: any) => t.type === 'sale' ? 'Venda' : 'Uso Interno' },
                                        { header: 'Qtd', accessor: 'quantity' },
                                        { header: 'Total', accessor: (t: any) => formatCurrency(t.totalValue) },
                                    ], 
                                    todaysTransactions
                                )} className="text-gray-600 hover:text-blue-700 p-1" title="Imprimir">
                                    <Printer size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            {todaysTransactions.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">Nenhuma movimentação hoje.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {todaysTransactions.map(t => (
                                        <li key={t.id} className="border-b last:border-0 pb-2 text-sm flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800">{t.itemName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {t.type === 'sale' ? <span className="text-green-600 font-semibold">Venda</span> : <span className="text-orange-500 font-semibold">Uso Interno</span>} 
                                                    • {t.date.split(' ')[1]}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                 <p className="font-bold">{formatCurrency(t.totalValue)}</p>
                                                 <p className="text-xs text-gray-500">{t.quantity} un</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: MANAGEMENT */}
            {activeTab === 'manage' && (
                <div className="no-print">
                    
                    {/* New Item Entry Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <Plus size={20} className="mr-2 text-primary"/> Cadastrar Novo Item / Entrada de Estoque
                        </h2>
                        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome do Item</label>
                                <input 
                                    type="text" 
                                    value={newItemData.name} 
                                    onChange={e => setNewItemData({...newItemData, name: e.target.value})} 
                                    className="w-full p-2 border rounded-md" 
                                    placeholder="Ex: Envelope Plástico" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo</label>
                                <select 
                                    value={newItemData.type} 
                                    onChange={e => setNewItemData({...newItemData, type: e.target.value})} 
                                    className="w-full p-2 border rounded-md bg-white"
                                >
                                    <option value="packaging">Embalagem</option>
                                    <option value="tape">Fita Adesiva</option>
                                    <option value="label">Etiqueta</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tamanho (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={newItemData.size} 
                                    onChange={e => setNewItemData({...newItemData, size: e.target.value})} 
                                    className="w-full p-2 border rounded-md" 
                                    placeholder="Ex: 20x30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Quantidade (Estoque)</label>
                                <input 
                                    type="number" 
                                    value={newItemData.stock} 
                                    onChange={e => setNewItemData({...newItemData, stock: e.target.value})} 
                                    className="w-full p-2 border rounded-md" 
                                    placeholder="0" 
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Custo Unitário (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={newItemData.cost} 
                                    onChange={e => setNewItemData({...newItemData, cost: e.target.value})} 
                                    className="w-full p-2 border rounded-md" 
                                    placeholder="0.00" 
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Preço Venda (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={newItemData.price} 
                                    onChange={e => setNewItemData({...newItemData, price: e.target.value})} 
                                    className="w-full p-2 border rounded-md" 
                                    placeholder="0.00" 
                                    min="0"
                                />
                            </div>
                            <div>
                                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-indigo-700 transition-colors font-bold shadow-sm flex items-center justify-center">
                                    <Save size={18} className="mr-2" /> Cadastrar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end mb-4 gap-2">
                        <button onClick={handleExportItemsCSV} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center hover:bg-gray-300 transition-colors" title="Exportar Inventário CSV">
                            <FileDown size={20} className="mr-2"/> Exportar
                        </button>
                        <button onClick={() => handlePrintTable('Relatório de Inventário - Ponto de Coleta', 
                            [
                                { header: 'Nome', accessor: 'name' },
                                { header: 'Tipo', accessor: 'type' },
                                { header: 'Tamanho', accessor: (i: any) => i.size || '-' },
                                { header: 'Estoque', accessor: 'stock' },
                                { header: 'Custo', accessor: (i: any) => formatCurrency(i.cost) },
                                { header: 'Preço Venda', accessor: (i: any) => formatCurrency(i.price) },
                            ], 
                            items
                        )} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center hover:bg-gray-300 transition-colors" title="Imprimir Inventário">
                            <Printer size={20} className="mr-2"/> Imprimir
                        </button>
                    </div>
                    <DataTable
                        columns={[
                            { header: 'Nome', accessor: 'name' },
                            { header: 'Tipo', accessor: (i: CollectionPointItem) => i.type === 'packaging' ? 'Embalagem' : (i.type === 'tape' ? 'Fita' : 'Outro') },
                            { header: 'Tamanho', accessor: (i: CollectionPointItem) => i.size || '-' },
                            { header: 'Custo', accessor: (i: CollectionPointItem) => formatCurrency(i.cost) },
                            { header: 'Preço Venda', accessor: (i: CollectionPointItem) => formatCurrency(i.price) },
                            { header: 'Estoque', accessor: 'stock' },
                        ]}
                        data={items}
                        selection={selection}
                        onSelectionChange={setSelection}
                        renderActions={(item) => (
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-yellow-600 hover:text-yellow-800"><Pencil size={18}/></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                            </div>
                        )}
                    />
                </div>
            )}

            {/* Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title='Editar Item'>
                <form onSubmit={handleSaveEditItem} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Item</label>
                        <input type="text" value={editingItem?.name || ''} onChange={e => setEditingItem(prev => ({...prev, name: e.target.value}))} className="w-full p-2 border rounded mt-1" required placeholder="Ex: Envelope P"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Tipo</label>
                             <select value={editingItem?.type || 'packaging'} onChange={e => setEditingItem(prev => ({...prev, type: e.target.value as any}))} className="w-full p-2 border rounded mt-1 bg-white">
                                 <option value="packaging">Embalagem (Envelope/Caixa)</option>
                                 <option value="tape">Fita Adesiva</option>
                                 <option value="label">Etiqueta</option>
                                 <option value="other">Outro</option>
                             </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Tamanho (Opcional)</label>
                            <input type="text" value={editingItem?.size || ''} onChange={e => setEditingItem(prev => ({...prev, size: e.target.value}))} className="w-full p-2 border rounded mt-1" placeholder="Ex: 20x30"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Preço Custo</label>
                            <input type="number" step="0.01" value={editingItem?.cost || ''} onChange={e => setEditingItem(prev => ({...prev, cost: parseFloat(e.target.value)}))} className="w-full p-2 border rounded mt-1" placeholder="0.00" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço Venda</label>
                            <input type="number" step="0.01" value={editingItem?.price || ''} onChange={e => setEditingItem(prev => ({...prev, price: parseFloat(e.target.value)}))} className="w-full p-2 border rounded mt-1" placeholder="0.00" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque</label>
                            <input type="number" value={editingItem?.stock || ''} onChange={e => setEditingItem(prev => ({...prev, stock: parseInt(e.target.value)}))} className="w-full p-2 border rounded mt-1" placeholder="0" required/>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded mr-2">Cancelar</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Salvar</button>
                    </div>
                </form>
            </Modal>

            {/* Hidden Print Area */}
            <div id="collection-point-print-area">
                {printableContent}
            </div>
        </div>
    );
};

export default CollectionPoint;
