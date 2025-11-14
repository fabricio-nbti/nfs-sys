import React, { useState } from 'react';
import { MOCK_ACCOUNTS_PAYABLE } from '../constants';
import { type AccountTransaction } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import Modal from './shared/Modal';

const statusColorMap: Record<string, string> = {
  'Paid': 'bg-green-100 text-green-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Overdue': 'bg-red-100 text-red-800',
};

const AccountsPayable: React.FC = () => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>(MOCK_ACCOUNTS_PAYABLE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'Descrição', accessor: 'description' as keyof AccountTransaction },
    { header: 'Categoria', accessor: 'category' as keyof AccountTransaction },
    { header: 'Vencimento', accessor: 'dueDate' as keyof AccountTransaction },
    { header: 'Valor', accessor: (item: AccountTransaction) => `R$ ${item.amount.toFixed(2)}` },
    {
      header: 'Status',
      accessor: (item: AccountTransaction) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[item.status]}`}>
          {item.status === 'Paid' ? 'Pago' : (item.status === 'Pending' ? 'Pendente' : 'Vencido')}
        </span>
      ),
    },
  ];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTransaction: AccountTransaction = {
      id: `PAY-${Date.now()}`,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      dueDate: formData.get('dueDate') as string,
      amount: parseFloat(formData.get('amount') as string),
      status: 'Pending',
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Contas a Pagar</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Nova Conta
        </button>
      </div>

      <DataTable<AccountTransaction>
        columns={columns}
        data={transactions}
        renderActions={(item) => (
          <div className="flex space-x-2">
            {item.status !== 'Paid' && <button className="text-green-600 hover:text-green-900"><CheckCircle size={18} /></button>}
            <button className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></button>
            <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Nova Conta a Pagar">
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
              <input type="text" name="description" id="description" required className="mt-1 p-2 w-full border rounded-md"/>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
              <input type="text" name="category" id="category" required className="mt-1 p-2 w-full border rounded-md"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                <input type="date" name="dueDate" id="dueDate" required className="mt-1 p-2 w-full border rounded-md"/>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <input type="number" name="amount" id="amount" step="0.01" required className="mt-1 p-2 w-full border rounded-md"/>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsPayable;