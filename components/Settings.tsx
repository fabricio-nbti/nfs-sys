import React from 'react';
import { type AppSettings } from '../types';
import ToggleSwitch from './shared/ToggleSwitch';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const handleToggle = (key: keyof AppSettings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>

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
