
import React, { useState, useMemo } from 'react';
import { MOCK_INVOICES } from '../constants';
import { type Invoice, InvoiceStatus } from '../types';
import { DataTable } from './shared/DataTable';
import { Edit, Trash2, Eye, Printer, X, ShieldX, FileText, Package, Receipt, Filter, Search, TrendingUp, AlertCircle, Ban } from 'lucide-react';
import Modal from './shared/Modal';
import DanfeView from './shared/DanfeView';

const statusColorMap: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Issued]: 'bg-green-100 text-green-800',
  [InvoiceStatus.Pending]: 'bg-yellow-100 text-yellow-800',
  [InvoiceStatus.Canceled]: 'bg-red-100 text-red-800',
};

const typeIconMap: Record<string, React.ReactNode> = {
  'NFe': <Package size={18} className="text-blue-600" />,
  'NFCe': <Receipt size={18} className="text-orange-600" />,
  'NFSe-MEI': <FileText size={18} className="text-purple-600" />,
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

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [isDanfeModalOpen, setIsDanfeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { filteredInvoices, summary } = useMemo(() => {
    let filtered = invoices;

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(inv => 
            inv.id.toLowerCase().includes(term) || 
            inv.customer.name.toLowerCase().includes(term)
        );
    }

    if (typeFilter !== 'all') {
        filtered = filtered.filter(inv => inv.type === typeFilter);
    }

    if (statusFilter !== 'all') {
        filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (startDate) {
        filtered = filtered.filter(inv => inv.issueDate >= startDate);
    }

    if (endDate) {
        filtered = filtered.filter(inv => inv.issueDate <= endDate);
    }

    // Summary calculations based on ALL data (or filtered if preferred context)
    // Using filtered data for summary allows user to see totals for specific periods
    const totalIssued = filtered.filter(i => i.status === InvoiceStatus.Issued).reduce((acc, i) => acc + i.totalInvoice, 0);
    const totalPending = filtered.filter(i => i.status === InvoiceStatus.Pending).reduce((acc, i) => acc + i.totalInvoice, 0);
    const totalCanceled = filtered.filter(i => i.status === InvoiceStatus.Canceled).reduce((acc, i) => acc + i.totalInvoice, 0);

    return { filteredInvoices: filtered, summary: { totalIssued, totalPending, totalCanceled } };
  }, [invoices, searchTerm, typeFilter, statusFilter, startDate, endDate]);

  const openDanfeModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDanfeModalOpen(true);
  }

  const columns = [
    { 
        header: 'Número', 
        accessor: (item: Invoice) => (
            <div className="flex items-center gap-2 font-medium text-gray-700">
               {typeIconMap[item.type] || <FileText size={18}/>}
               <span>{item.id}</span>
            </div>
        )
    },
    { header: 'Cliente', accessor: (item: Invoice) => item.customer.name },
    { 
        header: 'Emissão', 
        accessor: (item: Invoice) => new Date(item.issueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
    },
    { 
        header: 'Valor', 
        accessor: (item: Invoice) => <span className="font-semibold text-gray-800">{formatCurrency(item.totalInvoice)}</span> 
    },
    { header: 'Tipo', accessor: 'type' as keyof Invoice },
    {
      header: 'Status',
      accessor: (item: Invoice) => (
        <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${statusColorMap[item.status]}`}>
          {item.status}
        </span>
      ),
    },
  ];
  
  const handleBulkCancel = () => {
    if (window.confirm(`Tem certeza que deseja cancelar ${selection.length} nota(s)?`)) {
        setInvoices(prev => prev.map(inv => selection.includes(inv.id) ? { ...inv, status: InvoiceStatus.Canceled } : inv));
        setSelection([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
             <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-primary" />
                Histórico de Notas Fiscais
             </h1>
             <p className="text-gray-500 mt-1">Consulte, imprima e gerencie todas as notas emitidas.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Total Emitido</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary.totalIssued)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600">
                  <TrendingUp size={24} />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Pendente</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary.totalPending)}</p>
              </div>
               <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                  <AlertCircle size={24} />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Cancelado</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.totalCanceled)}</p>
              </div>
               <div className="p-3 bg-red-50 rounded-full text-red-600">
                  <Ban size={24} />
              </div>
          </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar</label>
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Nº Nota, Cliente..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                  <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                      <option value="all">Todos</option>
                      <option value="NFe">NFe</option>
                      <option value="NFCe">NFCe</option>
                      <option value="NFSe-MEI">NFSe</option>
                  </select>
              </div>
              <div>
                   <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                      <option value="all">Todos</option>
                      <option value={InvoiceStatus.Issued}>Emitida</option>
                      <option value={InvoiceStatus.Pending}>Pendente</option>
                      <option value={InvoiceStatus.Canceled}>Cancelada</option>
                  </select>
              </div>
              <div>
                   <label className="block text-xs font-semibold text-gray-500 mb-1">Período</label>
                   <div className="flex gap-2">
                       <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-1/2 p-2 border border-gray-200 rounded-lg text-xs" />
                       <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-1/2 p-2 border border-gray-200 rounded-lg text-xs" />
                   </div>
              </div>
          </div>
      </div>

      {/* Bulk Actions */}
      {selection.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-4 rounded-xl flex justify-between items-center shadow-sm animate-fade-in">
            <span className="font-medium flex items-center gap-2">
                <div className="bg-indigo-200 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {selection.length}
                </div>
                item(s) selecionado(s)
            </span>
            <div>
              <button
                onClick={handleBulkCancel}
                className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center transition-colors shadow-sm"
              >
                <ShieldX size={16} className="mr-2" />
                Cancelar Notas
              </button>
            </div>
          </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable<Invoice>
            columns={columns}
            data={filteredInvoices}
            selection={selection}
            onSelectionChange={setSelection}
            renderActions={(item) => (
              <div className="flex space-x-2">
                <button onClick={() => openDanfeModal(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Visualizar DANFE"><Eye size={18} /></button>
                {item.status !== InvoiceStatus.Canceled && (
                     <button className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Cancelar Nota"><ShieldX size={18} /></button>
                )}
              </div>
            )}
          />
      </div>
      
      {/* DANFE View Modal */}
      {isDanfeModalOpen && selectedInvoice && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
             <div className="flex justify-between items-center p-4 border-b bg-gray-50 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Visualização de DANFE</h3>
                        <p className="text-xs text-gray-500">NFe Nº {selectedInvoice.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-50 transition-colors font-medium shadow-sm">
                      <Printer size={18} className="mr-2" />
                      Imprimir
                  </button>
                  <button onClick={() => setIsDanfeModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
             </div>
             <div className="overflow-y-auto p-6 bg-gray-100">
                 <div className="bg-white shadow-lg mx-auto max-w-[210mm]"> {/* A4 width approx */}
                    <DanfeView invoice={selectedInvoice} />
                 </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default Invoices;
