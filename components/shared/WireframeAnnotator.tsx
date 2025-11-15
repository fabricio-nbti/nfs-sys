
import React, { useRef, useState } from 'react';
import { type DamageMarker } from '../../types';
import { X } from 'lucide-react';

interface WireframeAnnotatorProps {
  deviceType: string;
  markers: DamageMarker[];
  onMarkersChange: (newMarkers: DamageMarker[]) => void;
  mode: 'edit' | 'view';
}

// Simple SVG components for wireframes
const PhoneWireframe: React.FC = () => (
    <svg viewBox="0 0 100 200" className="w-full h-full">
        <rect x="5" y="5" width="90" height="190" rx="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="30" y="15" width="40" height="4" rx="2" fill="currentColor" />
    </svg>
);
const TVWireframe: React.FC = () => (
    <svg viewBox="0 0 200 120" className="w-full h-full">
        <rect x="5" y="5" width="190" height="110" rx="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M80,115 l-10,5 h60 l-10,-5 z" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
);
const CarWireframe: React.FC = () => (
    <svg viewBox="0 0 200 80" className="w-full h-full">
        <path d="M10 50 L20 50 L30 30 L170 30 L180 50 L190 50 L190 60 L180 60 L180 70 L160 70 L160 60 L60 60 L60 70 L40 70 L40 60 L20 60 L10 60 Z" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="50" cy="70" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="150" cy="70" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);
const SecurityCameraWireframe: React.FC = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M20 40 H80" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M50 40 V20 H70 V40" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="50" cy="65" r="25" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="50" cy="65" r="10" fill="currentColor" />
    </svg>
);
const SolarPanelWireframe: React.FC = () => (
    <svg viewBox="0 0 150 100" className="w-full h-full">
        <rect x="5" y="5" width="140" height="90" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="55" y1="5" x2="55" y2="95" stroke="currentColor" strokeWidth="1" />
        <line x1="105" y1="5" x2="105" y2="95" stroke="currentColor" strokeWidth="1" />
        <line x1="5" y1="50" x2="145" y2="50" stroke="currentColor" strokeWidth="1" />
    </svg>
);
const ServerWireframe: React.FC = () => (
    <svg viewBox="0 0 100 150" className="w-full h-full">
        <rect x="10" y="10" width="80" height="130" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="20" y="20" width="60" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="20" y="45" width="60" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="20" y="70" width="60" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="70" cy="27.5" r="2" fill="currentColor"/>
        <circle cx="70" cy="52.5" r="2" fill="currentColor"/>
        <circle cx="70" cy="77.5" r="2" fill="currentColor"/>
    </svg>
);


const WireframeAnnotator: React.FC<WireframeAnnotatorProps> = ({ deviceType = 'Celular', markers, onMarkersChange, mode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getWireframeForDevice = () => {
    switch(deviceType) {
        // Mobile
        case 'Celular':
        case 'Notebook':
            return <PhoneWireframe />;

        // Electronics
        case 'TV':
        case 'Aparelho de Som':
        case 'Microondas':
        case 'Video Game':
            return <TVWireframe />;

        // Automotive
        case 'Carro':
        case 'Moto':
        case 'Caminhão':
            return <CarWireframe />;
        
        // Security
        case 'Sistema de CFTV':
        case 'Alarme Monitorado':
        case 'Cerca Elétrica':
        case 'Controle de Acesso':
        case 'Interfonia':
            return <SecurityCameraWireframe />;

        // Solar Energy
        case 'Sistema Fotovoltaico On-Grid':
        case 'Sistema Fotovoltaico Off-Grid':
        case 'Manutenção Preventiva':
        case 'Limpeza de Painéis':
        case 'Troca de Inversor':
            return <SolarPanelWireframe />;

        // IT Consulting
        case 'Manutenção de Servidor':
        case 'Suporte Técnico Remoto':
        case 'Gestão de Rede':
        case 'Backup em Nuvem':
        case 'Segurança da Informação':
            return <ServerWireframe />;
        
        // Handle 'Outro' and other defaults
        default:
            return <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 text-gray-500"><span>Wireframe Indisponível para o tipo '{deviceType}'.</span></div>;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const description = prompt('Descreva a avaria ou o ponto de atenção:');
    if (description) {
      onMarkersChange([...markers, { x, y, description }]);
    }
  };
  
  const removeMarker = (indexToRemove: number) => {
      onMarkersChange(markers.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`w-full max-w-sm mx-auto h-96 relative bg-gray-50 rounded-lg p-2 ${mode === 'edit' ? 'cursor-crosshair' : ''}`} ref={containerRef} onClick={handleClick}>
       <div className="w-full h-full text-gray-300 flex items-center justify-center">
         {getWireframeForDevice()}
       </div>
       {markers.map((marker, index) => (
         <div 
            key={index} 
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
         >
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {marker.description}
            </div>
             {mode === 'edit' && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation(); // prevent adding a new marker
                        removeMarker(index);
                    }}
                    className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                    <X size={10}/>
                </button>
             )}
         </div>
       ))}
    </div>
  );
};

export default WireframeAnnotator;
