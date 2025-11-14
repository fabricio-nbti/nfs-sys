import React from 'react';
import { type AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const ToggleSwitch: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
      <span className="font-medium text-gray-700">{label}</span>
      <button
        type="button"
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
          enabled ? 'bg-primary' : 'bg-gray-300'
        }`}
        onClick={() => onChange(!enabled)}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};


const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const handleToggle = (key: keyof AppSettings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
          Visibilidade das Páginas
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Controle quais módulos aparecerão na barra de navegação lateral.
        </p>
        <div className="space-y-4">
          <ToggleSwitch
            label="Página de Emissão de Notas"
            enabled={settings.showInvoiceIssuing}
            onChange={() => handleToggle('showInvoiceIssuing')}
          />
          <ToggleSwitch
            label="O.S. - Celulares & Notebooks"
            enabled={settings.showMobileRepair}
            onChange={() => handleToggle('showMobileRepair')}
          />
          <ToggleSwitch
            label="O.S. - Eletrônicos"
            enabled={settings.showElectronicsRepair}
            onChange={() => handleToggle('showElectronicsRepair')}
          />
           <ToggleSwitch
            label="O.S. - Automotivo"
            enabled={settings.showAutomotiveRepair}
            onChange={() => handleToggle('showAutomotiveRepair')}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;