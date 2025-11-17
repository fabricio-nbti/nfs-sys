import React, { useState } from 'react';
import { UploadCloud, ShieldCheck, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import Modal from './shared/Modal';
import { type Company, type Page } from '../types';

interface DigitalCertificateProps {
  companies: Company[];
  onCompanyExtracted: (companyData: Partial<Company>) => void;
  setCurrentPage: (page: Page) => void;
}

const DigitalCertificate: React.FC<DigitalCertificateProps> = ({ companies, onCompanyExtracted, setCurrentPage }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<Company> | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
        setError('Tipo de arquivo inválido. Por favor, selecione um arquivo .pfx ou .p12');
        return;
      }
      setError('');
      setExtractedData(null);
      setIsPasswordModalOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  const handlePasswordSubmit = () => {
    if (!password) {
      alert("A senha é obrigatória.");
      return;
    }
    setIsPasswordModalOpen(false);
    setIsLoading(true);

    // --- SIMULATION of reading certificate ---
    setTimeout(() => {
      // Em uma aplicação real, você usaria um serviço de backend ou biblioteca WASM para analisar o arquivo PFX.
      // Para esta simulação de frontend, retornaremos dados mockados.
      const mockExtractedData: Partial<Company> = {
        legalName: 'EMPRESA EXTRAIDA DO CERTIFICADO LTDA',
        document: '12.345.678/0001-99',
        address: 'RUA FICTICIA, 123, CENTRO, SAO PAULO, SP - 01001-000',
        name: 'NOME FANTASIA DO CERTIFICADO',
        stateRegistration: '111.222.333.444',
        hasCertificate: true,
        certificateExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expira em 1 ano
      };
      setExtractedData(mockExtractedData);
      setIsLoading(false);
      setPassword('');
    }, 1500);
    // --- END SIMULATION ---
  };
  
  const handleSaveAndRegister = () => {
      if(extractedData){
          const existingCompany = companies.find(c => c.document === extractedData.document);
          if (existingCompany) {
              if (window.confirm(`Já existe uma empresa com o CNPJ ${extractedData.document}. Deseja atualizar os dados e vincular este certificado a ela?`)) {
                  onCompanyExtracted({ ...existingCompany, ...extractedData });
              }
          } else {
              onCompanyExtracted(extractedData);
          }
      }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Certificado Digital (A1)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold text-gray-700 mb-4">Fazer Upload do Certificado</h2>
           <p className="text-sm text-gray-500 mb-4">Arraste e solte ou clique para selecionar o arquivo do seu certificado (.pfx ou .p12). Os dados da empresa serão lidos automaticamente para facilitar o cadastro.</p>
           
           <label
            htmlFor="certificate-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
           >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                <p className="text-xs text-gray-500">Arquivo .PFX ou .P12</p>
            </div>
            <input id="certificate-upload" type="file" className="hidden" accept=".pfx,.p12" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
           </label>
           {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

           {isLoading && (
            <div className="mt-4 flex items-center justify-center text-gray-600">
                <Loader2 className="animate-spin mr-2"/>
                <span>Lendo certificado...</span>
            </div>
           )}

           {extractedData && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-green-800">Certificado lido com sucesso!</h3>
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                    <p><strong>Razão Social:</strong> {extractedData.legalName}</p>
                    <p><strong>CNPJ:</strong> {extractedData.document}</p>
                    <p><strong>Válido até:</strong> {new Date(extractedData.certificateExpires!).toLocaleDateString('pt-BR')}</p>
                </div>
                <button 
                  onClick={handleSaveAndRegister}
                  className="mt-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Confirmar e Cadastrar Empresa
                </button>
            </div>
           )}
        </div>

        {/* Status Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Status dos Certificados</h2>
            <div className="space-y-3">
                {companies.map(company => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800">{company.name}</p>
                            <p className="text-xs text-gray-500">{company.document}</p>
                        </div>
                        {company.hasCertificate ? (
                            <div className="flex items-center text-green-600">
                                <ShieldCheck size={20} className="mr-2"/>
                                <span className="text-sm font-medium">Válido até {new Date(company.certificateExpires!).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ) : (
                             <div className="flex items-center text-yellow-600">
                                 <ShieldAlert size={20} className="mr-2"/>
                                 <span className="text-sm font-medium">Pendente</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Senha do Certificado Digital">
        <div className="space-y-4">
            <p>Para ler os dados do arquivo do certificado, por favor, informe a senha de proteção.</p>
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Senha do certificado"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
            </div>
             <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="button" onClick={handlePasswordSubmit} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Confirmar</button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default DigitalCertificate;
