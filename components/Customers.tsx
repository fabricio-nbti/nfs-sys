
import React, { useState } from 'react';
import { MOCK_CUSTOMERS } from '../constants';
import { type Customer } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Customer },
    { header: 'Email', accessor: 'email' as keyof Customer },
    { header: 'Telefone', accessor: 'phone' as keyof Customer },
    { header: 'CPF/CNPJ', accessor: 'document' as keyof Customer },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </button>
      </div>

      <DataTable<Customer>
        columns={columns}
        data={customers}
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
