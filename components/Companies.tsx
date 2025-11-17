
import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { MOCK_COMPANIES } from '../constants';
import { type Company } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, UploadCloud, Printer } from 'lucide-react';
import Modal from './shared/Modal';

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [selection, setSelection] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

   const availableColumnsForPrint = [
    { key: 'name', label: 'Nome Fantasia' },
    { key: 'legalName', label: 'Razão Social' },
    { key: 'document', label: 'CNPJ' },
    { key: 'address', label: 'Endereço' },
    { key: 'stateRegistration', label: 'Inscrição Estadual' },
  ];

  const [selectedPrintColumns, setSelectedPrintColumns] = useState<Record<string, boolean>>({
    name: true,
    legalName: true,
    document: true,
    address: true,
  });

  const columns = [
    { header: 'Nome Fantasia', accessor: 'name' as keyof Company },
    { header: 'Razão Social', accessor: 'legalName' as keyof Company },
    { header: 'CNPJ', accessor: 'document' as keyof Company },
    { header: 'Endereço', accessor: 'address' as keyof Company },
  ];

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
            const requiredHeaders = ['name', 'legalname', 'document', 'address'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                throw new Error(`O cabeçalho do CSV é inválido. É necessário conter: name, legalName, document, address`);
            }
            
            const newCompanies: Company[] = lines.slice(1).map((line, index): Company | null => {
                const values = line.split(',');
                const companyData: any = {};
                headers.forEach((header, i) => {
                    const key = header === 'legalname' ? 'legalName' : (header === 'stateregistration' ? 'stateRegistration' : header);
                    companyData[key] = values[i]?.trim();
                });

                if (!companyData.name || !companyData.legalName || !companyData.document || !companyData.address) {
                    console.warn(`Linha ${index + 2} ignorada por dados inválidos: ${line}`);
                    return null;
                }
                
                return {
                    id: `comp-${Date.now()}-${index}`,
                    name: companyData.name,
                    legalName: companyData.legalName,
                    document: companyData.document,
                    address: companyData.address,
                    stateRegistration: companyData.stateRegistration || undefined,
                };
            }).filter((c): c is Company => c !== null);

            if (newCompanies.length === 0) {
                throw new Error("Nenhuma empresa válida encontrada no arquivo.");
            }
            
            setCompanies(prevCompanies => {
                const existingDocs = new Set(prevCompanies.map(c => c.document));
                const uniqueNewCompanies = newCompanies.filter(c => !existingDocs.has(c.document));
                
                const skippedCount = newCompanies.length - uniqueNewCompanies.length;
                if (skippedCount > 0) {
                    alert(`${skippedCount} empresa(s) foram ignoradas por já possuírem CNPJ cadastrado.`);
                }

                return [...prevCompanies, ...uniqueNewCompanies];
            });

            alert(`${newCompanies.length} empresa(s) analisada(s) e importada(s) com sucesso!`);

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
        <h1 className="text-2xl font-bold mb-4 text-center">Lista de Empresas</h1>
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
            {companies.map(company => (
              <tr key={company.id}>
                {activeColumns.map(col => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                    {company[col.key as keyof Company] as React.ReactNode ?? ''}
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
        <h1 className="text-3xl font-bold text-gray-800">Empresas</h1>
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
              Nova Empresa
            </button>
        </div>
      </div>
      <p className="text-gray-600 mb-4 no-print">Gerencie as empresas emissoras de notas fiscais. É necessário configurar o certificado digital no backend para cada empresa.</p>

      <div className="no-print">
        <DataTable<Company>
          columns={columns}
          data={companies}
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

      <div id="companies-dynamic-print-area">
        {printableContent}
      </div>
    </div>
  );
};

export default Companies;