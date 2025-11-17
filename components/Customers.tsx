
import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { MOCK_CUSTOMERS } from '../constants';
import { type Customer } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, UploadCloud, Printer } from 'lucide-react';
import Modal from './shared/Modal';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [selection, setSelection] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                    console.warn(`Linha ${index + 2} ignorada por dados inválidos: ${line}`);
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

            if (newCustomers.length === 0) {
                throw new Error("Nenhum cliente válido encontrado no arquivo.");
            }
            
            setCustomers(prevCustomers => {
                const existingDocs = new Set(prevCustomers.map(c => c.document));
                const uniqueNewCustomers = newCustomers.filter(c => !existingDocs.has(c.document));
                
                const skippedCount = newCustomers.length - uniqueNewCustomers.length;
                if (skippedCount > 0) {
                    alert(`${skippedCount} cliente(s) foram ignorados por já possuírem CPF/CNPJ cadastrado.`);
                }

                return [...prevCustomers, ...uniqueNewCustomers];
            });

            alert(`${newCustomers.length} cliente(s) analisado(s) e importado(s) com sucesso!`);

        } catch (error) {
            if (error instanceof Error) {
              alert(`Erro ao importar arquivo: ${error.message}`);
            } else {
              alert('Ocorreu um erro desconhecido ao processar o arquivo.');
            }
        } finally {
          if(event.target) {
            event.target.value = '';
          }
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
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <div className="flex items-center gap-2">
           <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
            <button onClick={handleImportClick} className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-600 transition-colors">
              <UploadCloud size={20} className="mr-2" />
              Importar
            </button>
            <button onClick={() => setIsPrintModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors">
              <Printer size={20} className="mr-2" />
              Imprimir Lista
            </button>
            <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
              <Plus size={20} className="mr-2" />
              Novo Cliente
            </button>
        </div>
      </div>

      <div className="no-print">
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
      </div>

      <div className="no-print">
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

      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Selecionar Colunas para Impressão">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">Escolha as informações que deseja incluir na impressão.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableColumnsForPrint.map(col => (
              <label key={col.key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={!!selectedPrintColumns[col.key]}
                  onChange={() => handleColumnSelectionChange(col.key)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => setIsPrintModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
          <button type="button" onClick={handleInitiatePrint} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Imprimir</button>
        </div>
      </Modal>

      <div id="customers-dynamic-print-area">
        {printableContent}
      </div>
    </div>
  );
};

export default Customers;