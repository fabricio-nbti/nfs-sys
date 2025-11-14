
import React, { useState } from 'react';
import { MOCK_COMPANIES } from '../constants';
import { type Company } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);

  const columns = [
    { header: 'Nome Fantasia', accessor: 'name' as keyof Company },
    { header: 'Razão Social', accessor: 'legalName' as keyof Company },
    { header: 'CNPJ', accessor: 'document' as keyof Company },
    { header: 'Endereço', accessor: 'address' as keyof Company },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Empresas</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Nova Empresa
        </button>
      </div>
      <p className="text-gray-600 mb-4">Gerencie as empresas emissoras de notas fiscais. É necessário configurar o certificado digital no backend para cada empresa.</p>

      <DataTable<Company>
        columns={columns}
        data={companies}
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

export default Companies;
