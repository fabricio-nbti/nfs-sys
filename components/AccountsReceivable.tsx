
import React, { useState, useMemo } from 'react';
import { MOCK_ACCOUNTS_RECEIVABLE } from '../constants';
import { type AccountTransaction } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, CheckCircle, Search, Filter, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import Modal from './shared/Modal';

const statusColorMap: Record<string, string> = {
  'Paid': 'bg-green-100 text-green-800',
  'Pending': 'bg-blue-100 text-blue-800',
  'Overdue': 'bg-red-100 text-red-800',
};

const statusLabelMap: Record<string, string> = {
  'Paid': 'Recebido',
  'Pending': 'Aguardando',
  'Overdue': 'Vencido',
};

const formatCurrency = (value: number | null | undefined): string => {
  const numberValue = Number(value);
  if (value === null || typeof value === 'undefined' || isNaN(numberValue)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};

const AccountsReceivable: React.FC = () => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>(MOCK_ACCOUNTS_RECEIVABLE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<AccountTransaction>>({});
  const [selection, setSelection] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Derived State for KPIs and Filtering
  const { filteredTransactions, summary } = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Calculate Summaries based on ALL transactions
    const totalPending = transactions.filter(t => t.status === 'Pending').reduce((acc, t) => acc + t.amount, 0);
    const totalOverdue = transactions.filter(t => t.status === 'Overdue').reduce((acc, t) => acc + t.amount, 0);
    const totalPaid = transactions.filter(t => t.status === 'Paid').reduce((acc, t) => acc + t.amount, 0);

    return {
      filteredTransactions: filtered,
      summary: { totalPending, totalOverdue, totalPaid }
    };
  }, [transactions, searchTerm, statusFilter]);

  const columns = [
    { header: 'Descrição', accessor: 'description' as keyof AccountTransaction },
    { header: 'Categoria', accessor: 'category' as keyof AccountTransaction },
    { 
        header: 'Vencimento', 
        accessor: (item: AccountTransaction) => new Date(item.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) 
    },
    { 
        header: 'Valor', 
        accessor: (item: AccountTransaction) => <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
    },
    {
      header: 'Status',
      accessor: (item: AccountTransaction) => (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[item.status]}`}>
          {statusLabelMap[item.status]}
        </span>
      ),
    },
  ];

  const openModal = () => {
      setEditingTransaction({ status: 'Pending' });
      setIsModalOpen(true);
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTransaction: AccountTransaction = {
      id: `REC-${Date.now()}`,
      description: editingTransaction.description || '',
      category: editingTransaction.category || '',
      dueDate: editingTransaction.dueDate || '',
      amount: editingTransaction.amount || 0,
      status: 'Pending',
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setIsModalOpen(false);
    setEditingTransaction({});
  };
  
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setEditingTransaction(prev => ({...prev, [name]: value }));
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: rawValue } = e.target;
    const onlyNumbers = rawValue.replace(/[^\d]/g, '');
    const numericValue = onlyNumbers ? parseFloat(onlyNumbers) / 100 : undefined;
    setEditingTransaction(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleBulkMarkAsPaid = () => {
    setTransactions(prev => prev.map(t => selection.includes(t.id) ? { ...t, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] } : t));
    setSelection([]);
  };

  return (
    <div>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
             <TrendingUp className="text-green-500" />
             Contas a Receber
           </h1>
           <p className="text-gray-500 mt-1">Controle suas vendas, faturas e recebimentos futuros.</p>
        </div>
        <button 
          onClick={openModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors shadow-sm">
          <Plus size={20} className="mr-2" />
          Novo Recebimento
        </button>
      </div>

       {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400 flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">A Receber</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary.totalPending)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Clock size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Vencido</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.totalOverdue)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-600">
                <AlertCircle size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Recebido</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600">
                <CheckCircle size={24} />
            </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
         </div>
         
         <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={20} className="text-gray-500" />
            <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white flex-grow md:flex-grow-0"
            >
                <option value="all">Todos os Status</option>
                <option value="Pending">Pendentes</option>
                <option value="Overdue">Vencidos</option>
                <option value="Paid">Recebidos</option>
            </select>
         </div>
      </div>

      {selection.length > 0 && (
         <div className="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 p-4 mb-4 rounded-r-lg flex justify-between items-center animate-fade-in">
            <span className="font-medium">{selection.length} item(s) selecionado(s)</span>
            <div>
              <button
                onClick={handleBulkMarkAsPaid}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center shadow-sm transition-colors"
              >
                <CheckCircle size={16} className="mr-2" />
                Marcar como Recebido
              </button>
            </div>
          </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <DataTable<AccountTransaction>
            columns={columns}
            data={filteredTransactions}
            selection={selection}
            onSelectionChange={setSelection}
            renderActions={(item) => (
            <div className="flex space-x-2">
                {item.status !== 'Paid' && <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Confirmar Recebimento"><CheckCircle size={18} /></button>}
                <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Editar"><Edit size={18} /></button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Excluir"><Trash2 size={18} /></button>
            </div>
            )}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Recebimento">
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <label htmlFor="rec-description" className="block text-sm font-medium text-gray-700">Descrição</label>
              <input type="text" name="description" id="rec-description" value={editingTransaction.description || ''} onChange={handleInputChange} required className="mt-1 p-2 w-full border rounded-md focus:ring-green-500 focus:border-green-500"/>
            </div>
            <div>
              <label htmlFor="rec-category" className="block text-sm font-medium text-gray-700">Categoria</label>
              <input type="text" name="category" id="rec-category" value={editingTransaction.category || ''} onChange={handleInputChange} required className="mt-1 p-2 w-full border rounded-md focus:ring-green-500 focus:border-green-500"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rec-dueDate" className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                <input type="date" name="dueDate" id="rec-dueDate" value={editingTransaction.dueDate || ''} onChange={handleInputChange} required className="mt-1 p-2 w-full border rounded-md focus:ring-green-500 focus:border-green-500"/>
              </div>
              <div>
                <label htmlFor="rec-amount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <input type="text" name="amount" id="rec-amount" value={formatCurrency(editingTransaction.amount)} onChange={handleCurrencyChange} required className="mt-1 p-2 w-full border rounded-md focus:ring-green-500 focus:border-green-500"/>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsReceivable;
