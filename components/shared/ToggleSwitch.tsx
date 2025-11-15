import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  labelClassName?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange, labelClassName }) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <span className={`font-medium text-gray-700 ${labelClassName || 'text-sm'}`}>{label}</span>
      <button
        type="button"
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
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

export default ToggleSwitch;
