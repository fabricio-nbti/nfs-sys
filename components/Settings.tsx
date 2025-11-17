import React, { useState, useEffect } from 'react';
import { type AppSettings, type Company } from '../types';
import ToggleSwitch from './shared/ToggleSwitch';
import { Save } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  mainCompany: Company | null;
  setMainCompany: React.Dispatch<React.SetStateAction<Company | null>>;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, mainCompany, setMainCompany }) => {
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({
    name: '',
    legalName: '',
    document: '',
    address: '',
    stateRegistration: '',
  });

  useEffect(() => {
    if (mainCompany) {
      setCompanyForm(mainCompany);
    }
  }, [mainCompany]);

  const handleToggle = (key: keyof AppSettings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.legalName || !companyForm.document) {
      alert('Razão Social e CNPJ são obrigatórios.');
      return;
    }
    const updatedCompany: Company = {
      id: mainCompany?.id || `main-comp-${Date.now()}`,
      name: companyForm.name || companyForm.legalName || '',
      legalName: companyForm.legalName,
      document: companyForm.document,
      address: companyForm.address || '',
      stateRegistration: companyForm.stateRegistration,
      hasCertificate: mainCompany?.hasCertificate || false,
      certificateExpires: mainCompany?.certificateExpires,
    };
    setMainCompany(updatedCompany);
    alert('Dados da empresa salvos com sucesso!');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
          Dados da Empresa Usuária
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Informações da sua empresa que serão utilizadas em todo o sistema. Se você se cadastrou com CNPJ, os dados já foram pré-preenchidos.
        </p>
        <form onSubmit={handleCompanySave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="legalName" className="block text-sm font-medium text-gray-700">Razão Social</label>
              <input type="text" id="legalName" name="legalName" value={companyForm.legalName || ''} onChange={handleCompanyInputChange} className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input type="text" id="name" name="name" value={companyForm.name || ''} onChange={handleCompanyInputChange} className="mt-1 p-2 border rounded w-full" />
            </div>
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700">CNPJ</label>
              <input type="text" id="document" name="document" value={companyForm.document || ''} onChange={handleCompanyInputChange} className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div>
              <label htmlFor="stateRegistration" className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input type="text" id="stateRegistration" name="stateRegistration" value={companyForm.stateRegistration || ''} onChange={handleCompanyInputChange} className="mt-1 p-2 border rounded w-full" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço Completo</label>
              <textarea id="address" name="address" value={companyForm.address || ''} onChange={handleCompanyInputChange} rows={3} className="mt-1 p-2 border rounded w-full"></textarea>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
              <Save size={18} className="mr-2" />
              Salvar Dados da Empresa
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
          Visibilidade dos Módulos
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Controle quais módulos aparecerão na barra de navegação lateral para todos os usuários.
        </p>
        <div className="space-y-4">
          <ToggleSwitch
            label="Página de Emissão de Notas"
            enabled={settings.showInvoiceIssuing}
            onChange={() => handleToggle('showInvoiceIssuing')}
            labelClassName="text-base"
          />
          <ToggleSwitch
            label="O.S. - Celulares & Notebooks"
            enabled={settings.showMobileRepair}
            onChange={() => handleToggle('showMobileRepair')}
            labelClassName="text-base"
          />
          <ToggleSwitch
            label="O.S. - Eletrônicos"
            enabled={settings.showElectronicsRepair}
            onChange={() => handleToggle('showElectronicsRepair')}
            labelClassName="text-base"
          />
          <ToggleSwitch
            label="O.S. - Automotivo"
            enabled={settings.showAutomotiveRepair}
            onChange={() => handleToggle('showAutomotiveRepair')}
            labelClassName="text-base"
          />
          <ToggleSwitch
            label="O.S. - Segurança Eletrônica"
            enabled={settings.showSecuritySystems}
            onChange={() => handleToggle('showSecuritySystems')}
            labelClassName="text-base"
          />
          <ToggleSwitch
            label="O.S. - Energia Solar"
            enabled={settings.showSolarEnergy}
            onChange={() => handleToggle('showSolarEnergy')}
            labelClassName="text-base"
          />
          <ToggleSwitch
            label="O.S. - Consultoria TI"
            enabled={settings.showITConsulting}
            onChange={() => handleToggle('showITConsulting')}
            labelClassName="text-base"
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;