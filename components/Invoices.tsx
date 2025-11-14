
import React, { useState } from 'react';
import { MOCK_INVOICES } from '../constants';
import { type Invoice, InvoiceStatus } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, Eye, Printer, X } from 'lucide-react';
import Modal from './shared/Modal';
import DanfeView from './shared/DanfeView';

const statusColorMap: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Issued]: 'bg-green-100 text-green-800',
  [InvoiceStatus.Pending]: 'bg-yellow-100 text-yellow-800',
  [InvoiceStatus.Canceled]: 'bg-red-100 text-red-800',
};

const Invoices: React.FC = () => {
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [isDanfeModalOpen, setIsDanfeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const openDanfeModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDanfeModalOpen(true);
  }

  const columns = [
    { header: 'Número', accessor: 'id' as keyof Invoice },
    { header: 'Cliente', accessor: (item: Invoice) => item.customer.name },
    { header: 'Emissão', accessor: 'issueDate' as keyof Invoice },
    { header: 'Valor', accessor: (item: Invoice) => `R$ ${item.totalInvoice.toFixed(2)}` },
    { header: 'Tipo', accessor: 'type' as keyof Invoice },
    {
      header: 'Status',
      accessor: (item: Invoice) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[item.status]}`}>
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Histórico de Notas Fiscais</h1>
        {/* O botão de emitir nota foi movido para a página dedicada 'Emissão de Notas' */}
      </div>

      <DataTable<Invoice>
        columns={columns}
        data={invoices}
        renderActions={(item) => (
          <div className="flex space-x-2">
            <button onClick={() => openDanfeModal(item)} className="text-blue-600 hover:text-blue-900"><Eye size={18} /></button>
            <button className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></button>
            <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
          </div>
        )}
      />
      
      {/* DANFE View Modal */}
      {isDanfeModalOpen && selectedInvoice && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
             <div className="flex justify-between items-center p-4 border-b no-print">
               <h3 className="text-xl font-semibold">Visualização de DANFE - NFe Nº {selectedInvoice.id}</h3>
                <div className="flex items-center gap-4">
                  <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                      <Printer size={18} className="mr-2" />
                      Imprimir DANFE
                  </button>
                  <button onClick={() => setIsDanfeModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                    <X size={24} />
                  </button>
                </div>
             </div>
             <div className="overflow-y-auto">
                <DanfeView invoice={selectedInvoice} />
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default Invoices;
