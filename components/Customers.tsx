
import React, { useState } from 'react';
import { MOCK_CUSTOMERS } from '../constants';
import { type Customer } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [selection, setSelection] = useState<string[]>([]);

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Customer },
    { header: 'Email', accessor: 'email' as keyof Customer },
    { header: 'Telefone', accessor: 'phone' as keyof Customer },
    { header: 'CPF/CNPJ', accessor: 'document' as keyof Customer },
  ];

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selection.length} cliente(s)?`)) {
      setCustomers(prev => prev.filter(c => !selection.includes(c.id)));
      setSelection([]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </button>
      </div>

      {selection.length > 0 && (
         <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 p-4 mb-4 rounded-r-lg flex justify-between items-center">
            <span>{selection.length} selecionado(s)</span>
            <div>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 flex items-center"
              >
                <Trash2 size={16} className="mr-1" />
                Excluir Selecionados
              </button>
            </div>
          </div>
      )}

      <DataTable<Customer>
        columns={columns}
        data={customers}
        selection={selection}
        onSelectionChange={setSelection}
        renderActions={(item) => (
          <div className="flex space-x-2">
            <button className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></button>
            <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
          </div>
        )}
      />
    </div>
  );
};

export default Customers;
