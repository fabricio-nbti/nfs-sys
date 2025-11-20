
import React, { useState, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { MOCK_CUSTOMERS } from '../constants';
import { type Customer } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, UploadCloud, Printer, Search, Users, UserPlus, Mail, Phone, MessageCircle } from 'lucide-react';
import Modal from './shared/Modal';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [selection, setSelection] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = useMemo(() => {
      return customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.document.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [customers, searchTerm]);

  const stats = useMemo(() => {
      // Simple mock stats since we don't have a "created_at" on Customer type yet
      const total = customers.length;
      const newThisMonth = Math.floor(total * 0.2); // Mock
      const active = Math.floor(total * 0.8); // Mock
      return { total, newThisMonth, active };
  }, [customers]);

  const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getRandomColor = (id: string) => {
      const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-yellow-100 text-yellow-600', 'bg-pink-100 text-pink-600'];
      const index = id.charCodeAt(id.length - 1) % colors.length;
      return colors[index];
  };

  const openModal = (customer: Customer | null) => {
    if (customer) {
        setEditingCustomer({...customer});
    } else {
        setEditingCustomer({
            id: `cust-${Date.now()}`,
            name: '', email: '', phone: '', document: '', address: ''
        });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCustomer) return;
      
      if (customers.some(c => c.id === editingCustomer.id)) {
          setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? editingCustomer as Customer : c));
      } else {
          setCustomers(prev => [editingCustomer as Customer, ...prev]);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setEditingCustomer(prev => prev ? {...prev, [name]: value} : null);
  };

  const availableColumnsForPrint = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'document', label: 'CPF/CNPJ' },
    { key: 'address', label: 'Endereço' },
  ];

  const [selectedPrintColumns, setSelectedPrintColumns] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    phone: true,
    document: true,
  });

  const columns = [
    { 
        header: 'Nome / Cliente', 
        accessor: (item: Customer) => (
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${getRandomColor(item.id)}`}>
                    {getInitials(item.name)}
                </div>
                <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.document}</p>
                </div>
            </div>
        )
    },
    { 
        header: 'Contato', 
        accessor: (item: Customer) => (
            <div className="text-sm">
                <p className="text-gray-700 flex items-center gap-1"><Mail size={12} className="text-gray-400"/> {item.email}</p>
                <p className="text-gray-500 flex items-center gap-1"><Phone size={12} className="text-gray-400"/> {item.phone}</p>
            </div>
        )
    },
    { 
        header: 'Ações Rápidas', 
        accessor: (item: Customer) => (
             <div className="flex gap-2">
                 <a href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors" title="WhatsApp">
                     <MessageCircle size={16} />
                 </a>
                 <a href={`mailto:${item.email}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors" title="Email">
                     <Mail size={16} />
                 </a>
             </div>
        )
    },
  ];

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selection.length} cliente(s)?`)) {
      setCustomers(prev => prev.filter(c => !selection.includes(c.id)));
      setSelection([]);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("O arquivo CSV está vazio ou contém apenas o cabeçalho.");

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'email', 'phone', 'document'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                throw new Error(`O cabeçalho do CSV é inválido. É necessário conter: ${requiredHeaders.join(', ')}`);
            }
            
            const newCustomers: Customer[] = lines.slice(1).map((line, index): Customer | null => {
                const values = line.split(',');
                const customerData: any = {};
                headers.forEach((header, i) => {
                    customerData[header] = values[i]?.trim();
                });

                if (!customerData.name || !customerData.email || !customerData.phone || !customerData.document) {
                    return null;
                }
                
                return {
                    id: `cust-${Date.now()}-${index}`,
                    name: customerData.name,
                    email: customerData.email,
                    phone: customerData.phone,
                    document: customerData.document,
                    address: customerData.address || undefined,
                };
            }).filter((c): c is Customer => c !== null);

            if (newCustomers.length === 0) throw new Error("Nenhum cliente válido encontrado no arquivo.");
            
            setCustomers(prevCustomers => {
                const existingDocs = new Set(prevCustomers.map(c => c.document));
                const uniqueNewCustomers = newCustomers.filter(c => !existingDocs.has(c.document));
                const skippedCount = newCustomers.length - uniqueNewCustomers.length;
                if (skippedCount > 0) alert(`${skippedCount} cliente(s) foram ignorados por já possuírem CPF/CNPJ cadastrado.`);
                return [...prevCustomers, ...uniqueNewCustomers];
            });
            alert(`${newCustomers.length} cliente(s) analisado(s) e importado(s) com sucesso!`);

        } catch (error) {
            if (error instanceof Error) alert(`Erro ao importar arquivo: ${error.message}`);
            else alert('Ocorreu um erro desconhecido ao processar o arquivo.');
        } finally {
          if(event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  const handleInitiatePrint = () => {
    const activeColumns = availableColumnsForPrint.filter(c => selectedPrintColumns[c.key]);

    const tableToPrint = (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Lista de Clientes</h1>
        <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {activeColumns.map(col => (
                <th key={col.key} scope="col" className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-b-2 border-gray-300">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map(customer => (
              <tr key={customer.id}>
                {activeColumns.map(col => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                    {customer[col.key as keyof Customer] as React.ReactNode ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    flushSync(() => {
        setPrintableContent(tableToPrint);
    });
    window.print();
    setPrintableContent(null);
    setIsPrintModalOpen(false);
  };

  const handleColumnSelectionChange = (key: string) => {
    setSelectedPrintColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
       {/* KPI Section */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-primary"><Users size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Novos (Mês)</p>
                  <p className="text-2xl font-bold text-green-600">+{stats.newThisMonth}</p>
              </div>
               <div className="p-2 bg-green-50 rounded-lg text-green-500"><UserPlus size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
               <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><MessageCircle size={20}/></div>
          </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 no-print">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por nome, CPF ou email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
           <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
            <button onClick={handleImportClick} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Importar">
              <UploadCloud size={20} />
            </button>
            <button onClick={() => setIsPrintModalOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
              <Printer size={20} />
            </button>
            <button 
                onClick={() => openModal(null)}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus size={18} className="mr-1.5" />
              Novo Cliente
            </button>
        </div>
      </div>

      {selection.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-xl flex justify-between items-center animate-fade-in no-print">
              <span className="text-sm font-medium ml-2">{selection.length} selecionado(s)</span>
              <div>
                <button
                  onClick={handleBulkDelete}
                  className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 flex items-center shadow-sm"
                >
                  <Trash2 size={14} className="mr-1" />
                  Excluir Selecionados
                </button>
              </div>
            </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden no-print">
        <DataTable<Customer>
          columns={columns}
          data={filteredCustomers}
          selection={selection}
          onSelectionChange={setSelection}
          renderActions={(item) => (
            <div className="flex space-x-2">
              <button onClick={() => openModal(item)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Edit size={18} /></button>
              <button onClick={() => {
                  if(window.confirm("Excluir cliente?")) setCustomers(prev => prev.filter(c => c.id !== item.id));
              }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
            </div>
          )}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer?.id ? "Editar Cliente" : "Novo Cliente"}>
          {editingCustomer && (
            <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <input type="text" name="name" value={editingCustomer.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF / CNPJ</label>
                        <input type="text" name="document" value={editingCustomer.document || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                        <input type="text" name="phone" value={editingCustomer.phone || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input type="email" name="email" value={editingCustomer.email || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço</label>
                    <input type="text" name="address" value={editingCustomer.address || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"/>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 mr-2">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium">Salvar</button>
                </div>
            </form>
          )}
      </Modal>

      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Imprimir Lista de Clientes">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Selecione os dados para impressão:</p>
          <div className="grid grid-cols-2 gap-3">
            {availableColumnsForPrint.map(col => (
              <label key={col.key} className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedPrintColumns[col.key]}
                  onChange={() => handleColumnSelectionChange(col.key)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end pt-4">
             <button type="button" onClick={handleInitiatePrint} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium">Imprimir</button>
          </div>
        </div>
      </Modal>

      <div id="customers-dynamic-print-area">
        {printableContent}
      </div>
    </div>
  );
};

export default Customers;
