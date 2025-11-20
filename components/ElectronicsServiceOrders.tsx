
import React, { useState, useMemo } from 'react';
import { MOCK_ELECTRONICS_SERVICE_ORDERS, MOCK_COMPANIES } from '../constants';
import { type ServiceOrder, ServiceOrderStatus, type DamageMarker } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Eye, Share2, ClipboardCopy, UploadCloud, Image as ImageIcon, Video, X, Trash2, Printer, Undo2, Tv, Radio, Gamepad2, Plug, Search, Clock, AlertTriangle, CheckCircle2, Wrench, Filter } from 'lucide-react';
import Modal from './shared/Modal';
import ServiceOrderReceiptView from './shared/ServiceOrderReceiptView';
import WireframeAnnotator from './shared/WireframeAnnotator';


const statusColorMap: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.Pending]: 'bg-blue-100 text-blue-700 border-blue-200',
  [ServiceOrderStatus.InProgress]: 'bg-amber-100 text-amber-700 border-amber-200',
  [ServiceOrderStatus.WaitingParts]: 'bg-orange-100 text-orange-700 border-orange-200',
  [ServiceOrderStatus.Completed]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [ServiceOrderStatus.Canceled]: 'bg-red-100 text-red-700 border-red-200',
};

const statusProgressMap: Record<ServiceOrderStatus, number> = {
    [ServiceOrderStatus.Pending]: 10,
    [ServiceOrderStatus.InProgress]: 40,
    [ServiceOrderStatus.WaitingParts]: 60,
    [ServiceOrderStatus.Completed]: 100,
    [ServiceOrderStatus.Canceled]: 0,
};

const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const ElectronicsServiceOrders: React.FC = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(MOCK_ELECTRONICS_SERVICE_ORDERS);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [orderToReprint, setOrderToReprint] = useState<ServiceOrder | null>(null);
  const [receiptOrderData, setReceiptOrderData] = useState<ServiceOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Partial<ServiceOrder> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [mediaPreview, setMediaPreview] = useState<{ type: 'image' | 'video'; url: string; } | null>(null);

  // --- DERIVED DATA ---

  const filteredOrders = useMemo(() => {
      return serviceOrders.filter(order => {
          const matchesTab = 
            activeTab === 'all' ? true :
            activeTab === 'active' ? [ServiceOrderStatus.Pending, ServiceOrderStatus.InProgress].includes(order.status) :
            activeTab === 'waiting' ? order.status === ServiceOrderStatus.WaitingParts :
            activeTab === 'completed' ? order.status === ServiceOrderStatus.Completed : true;

          const matchesSearch = 
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deviceType.toLowerCase().includes(searchTerm.toLowerCase());

          return matchesTab && matchesSearch;
      });
  }, [serviceOrders, activeTab, searchTerm]);

  const stats = useMemo(() => {
      const open = serviceOrders.filter(o => o.status !== ServiceOrderStatus.Completed && o.status !== ServiceOrderStatus.Canceled).length;
      const waiting = serviceOrders.filter(o => o.status === ServiceOrderStatus.WaitingParts).length;
      const completed = serviceOrders.filter(o => o.status === ServiceOrderStatus.Completed);
      const revenue = completed.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
      
      return { open, waiting, completedCount: completed.length, revenue };
  }, [serviceOrders]);

  // --- COLUMNS ---

  const getDeviceIcon = (type: string) => {
      const t = type.toLowerCase();
      if (t.includes('tv') || t.includes('monitor')) return <Tv size={20}/>;
      if (t.includes('som') || t.includes('radio') || t.includes('audio')) return <Radio size={20}/>;
      if (t.includes('game') || t.includes('console')) return <Gamepad2 size={20}/>;
      return <Plug size={20}/>;
  };

  const columns = [
    { 
        header: 'O.S. / Equipamento', 
        accessor: (item: ServiceOrder) => (
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    {getDeviceIcon(item.deviceType)}
                </div>
                <div>
                    <span className="font-bold text-gray-800 block">{item.id}</span>
                    <span className="text-xs text-gray-500">{item.deviceType} - {item.deviceBrand}</span>
                </div>
            </div>
        ) 
    },
    { 
        header: 'Cliente', 
        accessor: (item: ServiceOrder) => (
            <div>
                <p className="font-medium text-gray-800">{item.customerName}</p>
                <p className="text-xs text-gray-500">{item.customerPhone || 'Sem telefone'}</p>
            </div>
        )
    },
    { 
        header: 'Status', 
        accessor: (item: ServiceOrder) => (
            <div>
                 <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColorMap[item.status]}`}>
                    {item.status}
                </span>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${item.status === ServiceOrderStatus.Canceled ? 'bg-red-400' : 'bg-amber-500'}`} 
                        style={{ width: `${statusProgressMap[item.status]}%` }}
                    ></div>
                </div>
            </div>
        ) 
    },
    { 
        header: 'Entrada', 
        accessor: (item: ServiceOrder) => new Date(item.creationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
    },
    { 
        header: 'Total', 
        accessor: (item: ServiceOrder) => (
            <span className={`font-bold ${item.totalValue ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                {item.totalValue ? formatCurrency(item.totalValue) : '---'}
            </span>
        )
    },
  ];

  // --- ACTIONS ---

  const openFormModal = (order: ServiceOrder | null = null) => {
    setSelectedOrder(order);
    setCurrentOrder(order ? { ...order } : { status: ServiceOrderStatus.Pending, damageMarkers: [] });
    setUploadedFiles([]);
    setIsFormModalOpen(true);
  };

  const openViewModal = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };
  
  const openLinkModal = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsLinkModalOpen(true);
  };

  const openReprintModal = (order: ServiceOrder) => {
    setOrderToReprint(order);
    setIsReprintModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentOrder(prev => {
        if (!prev) return null;
        
        let finalValue: any = value;
        if (name === 'serviceCost' || name === 'partsCost' || name === 'warrantyMonths') {
            finalValue = value === '' ? undefined : parseFloat(value);
        }

        const updatedOrder = { ...prev, [name]: finalValue };

        if (name === 'status' && value === ServiceOrderStatus.Completed && !updatedOrder.dataConclusao) {
            updatedOrder.dataConclusao = new Date().toISOString().split('T')[0];
        }
        return updatedOrder;
    });
  };

  const handleMarkersChange = (newMarkers: DamageMarker[]) => {
    setCurrentOrder(prev => prev ? { ...prev, damageMarkers: newMarkers } : null);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (currentOrder) {
          const serviceCost = Number(currentOrder.serviceCost) || 0;
          const partsCost = Number(currentOrder.partsCost) || 0;
          const totalValue = serviceCost + partsCost > 0 ? serviceCost + partsCost : undefined;

          if (currentOrder.id) { // Update existing order
              const updatedOrder = {
                  ...currentOrder,
                  totalValue
              } as ServiceOrder;
              setServiceOrders(prev => prev.map(o => o.id === currentOrder.id ? updatedOrder : o));
              alert('Ordem de Serviço atualizada com sucesso!');
              setIsFormModalOpen(false);
              setCurrentOrder(null);
          } else { // Create new order
              const timestamp = Date.now();
              const newOrder = {
                  ...currentOrder,
                  id: `OSE-${timestamp}`,
                  creationDate: new Date().toISOString().split('T')[0],
                  publicLink: `https://example.com/os/view/ose-${timestamp}`,
                  totalValue
              } as ServiceOrder;
              setServiceOrders(prev => [newOrder, ...prev]);

              setReceiptOrderData(newOrder);
              setIsReceiptModalOpen(true);
              setIsFormModalOpen(false);
              setCurrentOrder(null);
          }
      }
  };

  const handleFileCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Link copiado para a área de transferência!');
    });
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selection.length} ordem(ns) de serviço?`)) {
      setServiceOrders(prev => prev.filter(os => !selection.includes(os.id)));
      setSelection([]);
    }
  };

  const handleReopenOrder = (orderToReopen: ServiceOrder) => {
    if (window.confirm(`Tem certeza que deseja reabrir a O.S. #${orderToReopen.id}?`)) {
        setServiceOrders(prev => 
            prev.map(os => 
                os.id === orderToReopen.id 
                ? { ...os, status: ServiceOrderStatus.InProgress, dataConclusao: undefined } 
                : os
            )
        );
    }
  };

  const qrCodeUrl = useMemo(() => {
    if (selectedOrder?.publicLink) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedOrder.publicLink)}`;
    }
    return '';
  }, [selectedOrder]);

  const renderMediaPreview = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
        {uploadedFiles.map((file, index) => (
            <div key={index} className="relative aspect-square border rounded-md p-1 flex items-center justify-center bg-gray-50">
                {file.type.startsWith('image/') ? <ImageIcon className="w-6 h-6 text-gray-400" /> : <Video className="w-6 h-6 text-gray-400" />}
                <p className="absolute bottom-1 text-[10px] truncate w-full px-1 text-center text-gray-500">{file.name}</p>
                <button 
                    type="button" 
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    onClick={() => setUploadedFiles(files => files.filter(f => f.name !== file.name))}
                >
                    <X size={10} />
                </button>
            </div>
        ))}
    </div>
  );

  const statusSteps = [
      { id: ServiceOrderStatus.Pending, label: 'Entrada' },
      { id: ServiceOrderStatus.InProgress, label: 'Análise/Reparo' },
      { id: ServiceOrderStatus.WaitingParts, label: 'Aguardando Peça' },
      { id: ServiceOrderStatus.Completed, label: 'Concluído' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & KPI Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Tv className="text-primary" /> O.S. - Eletrônicos
            </h1>
            <p className="text-gray-500 text-sm">Manutenção de TVs, Áudio, Microondas e outros aparelhos.</p>
        </div>
        <button 
          onClick={() => openFormModal()}
          className="bg-primary text-white px-5 py-2.5 rounded-xl flex items-center hover:bg-indigo-700 transition-all shadow-lg font-medium"
        >
          <Plus size={20} className="mr-2" />
          Nova O.S.
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Em Aberto</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Clock size={24}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Aguardando Peça</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.waiting}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><AlertTriangle size={24}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Concluídas</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.completedCount}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500"><CheckCircle2 size={24}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Faturamento (Est.)</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.revenue)}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><Wrench size={24}/></div>
          </div>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
               {[
                   { id: 'all', label: 'Todos' },
                   { id: 'active', label: 'Em Andamento' },
                   { id: 'waiting', label: 'Aguardando Peça' },
                   { id: 'completed', label: 'Concluídos' }
               ].map(tab => (
                   <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-indigo-50 text-primary' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                   >
                       {tab.label}
                   </button>
               ))}
          </div>
          
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar O.S., cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
             />
          </div>
      </div>

      {/* Bulk Actions */}
      {selection.length > 0 && (
         <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-xl flex justify-between items-center animate-fade-in">
            <span className="font-medium text-sm ml-2">{selection.length} selecionado(s)</span>
            <button
                onClick={handleBulkDelete}
                className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 flex items-center transition-colors shadow-sm"
            >
                <Trash2 size={14} className="mr-1" />
                Excluir
            </button>
          </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable<ServiceOrder>
            columns={columns}
            data={filteredOrders}
            selection={selection}
            onSelectionChange={setSelection}
            renderActions={(item) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openViewModal(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar">
                    <Eye size={18} />
                </button>
                {item.status !== ServiceOrderStatus.Completed && item.status !== ServiceOrderStatus.Canceled && (
                  <button onClick={() => openFormModal(item)} className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Editar">
                      <Edit size={18} />
                  </button>
                )}
                {item.status === ServiceOrderStatus.Completed && (
                   <button onClick={() => handleReopenOrder(item)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reabrir">
                      <Undo2 size={18} />
                   </button>
                )}
                <button onClick={() => openLinkModal(item)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Link">
                    <Share2 size={18} />
                </button>
                <button onClick={() => openReprintModal(item)} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
                    <Printer size={18} />
                </button>
              </div>
            )}
          />
      </div>

      {/* Form Modal (Create/Edit) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={currentOrder?.id ? `Editar O.S. #${currentOrder.id}` : "Nova Ordem de Serviço"} size="4xl">
         <form onSubmit={handleFormSubmit} className="flex flex-col h-[80vh]">
             {/* Status Stepper (Visual) */}
            <div className="mb-6 px-4 pt-2">
                <div className="flex justify-between relative">
                     <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
                     {statusSteps.map((step, index) => {
                         const isActive = currentOrder?.status === step.id;
                         const isCompleted = statusProgressMap[currentOrder?.status || ServiceOrderStatus.Pending] >= statusProgressMap[step.id];
                         
                         return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-2 cursor-pointer" onClick={() => setCurrentOrder(prev => prev ? {...prev, status: step.id} : null)}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${isActive ? 'bg-primary border-primary text-white' : isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                    {index + 1}
                                </div>
                                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>{step.label}</span>
                            </div>
                         );
                     })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Customer Card */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><Filter size={16} className="mr-2"/> Dados do Cliente</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <input type="text" name="customerName" placeholder="Nome Completo" value={currentOrder?.customerName || ''} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                                </div>
                                <input type="tel" name="customerPhone" placeholder="Telefone / WhatsApp" value={currentOrder?.customerPhone || ''} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"/>
                                <input type="email" name="customerEmail" placeholder="E-mail (Opcional)" value={currentOrder?.customerEmail || ''} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"/>
                            </div>
                        </div>
                        
                        {/* Device Card */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><Tv size={16} className="mr-2"/> Equipamento</h3>
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                 <select name="deviceType" value={currentOrder?.deviceType || 'TV'} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg bg-white outline-none">
                                    <option>TV</option>
                                    <option>Aparelho de Som</option>
                                    <option>Microondas</option>
                                    <option>Video Game</option>
                                    <option>Monitor</option>
                                    <option>Outro</option>
                                </select>
                                 <input type="text" name="deviceBrand" placeholder="Marca (ex: Samsung)" value={currentOrder?.deviceBrand || ''} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none" required/>
                                 <input type="text" name="deviceModel" placeholder="Modelo (ex: 50TU8000)" value={currentOrder?.deviceModel || ''} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none" required/>
                                 <input type="text" name="imeiOrSerial" placeholder="Nº de Série" value={currentOrder?.imeiOrSerial || ''} onChange={handleInputChange} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none"/>
                             </div>
                             <textarea name="reportedProblem" placeholder="Defeito relatado pelo cliente..." value={currentOrder?.reportedProblem || ''} onChange={handleInputChange} rows={3} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg outline-none resize-none mb-3" required></textarea>
                             
                             {/* Visual Annotator inside the form */}
                             <div className="border rounded-lg bg-white p-2">
                                <p className="text-xs text-gray-500 mb-1 text-center">Marque avarias no diagrama</p>
                                <div className="h-48">
                                    {currentOrder && (
                                        <WireframeAnnotator 
                                            deviceType={currentOrder.deviceType || 'TV'}
                                            markers={currentOrder.damageMarkers || []}
                                            onMarkersChange={handleMarkersChange}
                                            mode="edit"
                                        />
                                    )}
                                </div>
                             </div>
                        </div>

                        {/* Files */}
                         <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-2">Fotos e Vídeos</h3>
                            <label htmlFor="file-upload-electronics" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <UploadCloud className="w-6 h-6 text-gray-400"/>
                                <span className="mt-2 text-xs text-gray-500">Clique para anexar</span>
                            </label>
                            <input id="file-upload-electronics" type="file" multiple className="hidden" onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}/>
                            {renderMediaPreview()}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><Wrench size={16} className="mr-2"/> Laudo & Serviço</h3>
                            
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Diagnóstico Técnico</label>
                                    <textarea name="technicianNotes" value={currentOrder?.technicianNotes || ''} onChange={handleInputChange} rows={4} className="w-full mt-1 p-2.5 text-sm border border-gray-300 rounded-lg outline-none resize-none bg-yellow-50" placeholder="Análise técnica do defeito..."></textarea>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Peças Utilizadas</label>
                                    <textarea name="partsUsed" value={currentOrder?.partsUsed || ''} onChange={handleInputChange} rows={3} className="w-full mt-1 p-2.5 text-sm border border-gray-300 rounded-lg outline-none resize-none" placeholder="Lista de componentes trocados..."></textarea>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">Mão de Obra (R$)</label>
                                        <input type="number" name="serviceCost" step="0.01" value={currentOrder?.serviceCost || ''} onChange={handleInputChange} className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg" placeholder="0,00"/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">Peças (R$)</label>
                                        <input type="number" name="partsCost" step="0.01" value={currentOrder?.partsCost || ''} onChange={handleInputChange} className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg" placeholder="0,00"/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                     <div>
                                        <label className="text-xs font-semibold text-gray-500">Garantia (meses)</label>
                                        <input type="number" name="warrantyMonths" value={currentOrder?.warrantyMonths || ''} onChange={handleInputChange} className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg" placeholder="3"/>
                                    </div>
                                </div>

                                <div className="bg-gray-100 p-4 rounded-xl mt-auto">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-gray-600">Total Estimado</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {formatCurrency((Number(currentOrder?.serviceCost) || 0) + (Number(currentOrder?.partsCost) || 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 border-t p-4 flex justify-end sticky bottom-0 bg-white rounded-b-xl">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg mr-3 hover:bg-gray-300 font-medium">Cancelar</button>
                <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-lg">Salvar Ordem</button>
            </div>
        </form>
      </Modal>

      {/* View Modal */}
       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalhes da O.S. - ${selectedOrder?.id}`}>
        {selectedOrder && (
          <div className="text-sm text-gray-700 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                 <div>
                    <h2 className="text-lg font-bold text-gray-800">{selectedOrder.customerName}</h2>
                    <p className="text-gray-500 text-sm">{selectedOrder.deviceType} {selectedOrder.deviceBrand} {selectedOrder.deviceModel}</p>
                </div>
                 <span className={`px-3 py-1 inline-flex text-sm font-bold rounded-full border ${statusColorMap[selectedOrder.status]}`}>{selectedOrder.status}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-3 rounded-lg">
                     <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Defeito</h4>
                     <p>{selectedOrder.reportedProblem}</p>
                </div>
                 <div className="border p-3 rounded-lg">
                     <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Laudo Técnico</h4>
                     <p>{selectedOrder.technicianNotes || '---'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <p><strong>Data Entrada:</strong> {new Date(selectedOrder.creationDate).toLocaleDateString('pt-BR')}</p>
                <p><strong>Previsão/Conclusão:</strong> {selectedOrder.dataConclusao || selectedOrder.estimatedDeliveryDate ? new Date(selectedOrder.dataConclusao || selectedOrder.estimatedDeliveryDate!).toLocaleDateString('pt-BR') : '---'}</p>
            </div>
            
            {selectedOrder.damageMarkers && selectedOrder.damageMarkers.length > 0 && (
                <div className="my-4 border rounded-lg p-2">
                    <h4 className="font-bold text-gray-800 mb-2 text-center">Mapeamento de Avarias</h4>
                     <WireframeAnnotator 
                        deviceType={selectedOrder.deviceType}
                        markers={selectedOrder.damageMarkers}
                        onMarkersChange={() => {}} // No-op in view mode
                        mode="view"
                    />
                </div>
            )}
            
            {/* FIX: Changed 'mediaUrls' to 'media' and improved rendering logic to support videos and a preview modal. */}
            {selectedOrder.media && selectedOrder.media.length > 0 && (
                <div>
                    <strong className="block mb-2">Mídia Anexada:</strong>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                        {selectedOrder.media.map((mediaItem, i) => (
                            <button 
                                key={i} 
                                onClick={() => setMediaPreview(mediaItem)} 
                                className="group relative aspect-video border rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label={`Visualizar mídia ${i + 1}`}
                            >
                                {mediaItem.type === 'image' ? (
                                    <img src={mediaItem.url} alt={`Mídia ${i + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Video className="w-10 h-10 text-gray-500 mx-auto" />
                                        <span className="text-xs text-gray-600 mt-1 block">Vídeo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all">
                                    <Eye size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center mt-4">
                <span className="font-bold text-gray-600">Valor Total</span>
                <span className="text-xl font-bold text-primary">{selectedOrder.totalValue ? `R$ ${selectedOrder.totalValue.toFixed(2)}` : 'A definir'}</span>
            </div>

            <div className="pt-4 flex justify-end">
                 <button type="button" onClick={() => setIsViewModalOpen(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium">Fechar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Link Modal */}
      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Link para Cliente">
        {selectedOrder && (
            <div className="flex flex-col items-center text-center">
                <p className="mb-4 text-gray-600">Compartilhe este QR Code ou link com o cliente para que ele possa acompanhar o status do serviço.</p>
                <div className="p-2 border rounded-lg shadow-sm bg-white">
                    <img src={qrCodeUrl} alt="QR Code para a Ordem de Serviço" className="w-40 h-40" />
                </div>
                <div className="mt-4 w-full relative">
                    <input type="text" readOnly value={selectedOrder.publicLink} className="w-full p-3 pr-10 border rounded-lg bg-gray-50 text-gray-600 text-sm"/>
                    <button onClick={() => handleFileCopy(selectedOrder.publicLink || '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-indigo-700 p-1">
                        <ClipboardCopy size={20} />
                    </button>
                </div>
                 <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Olá ${selectedOrder.customerName}, acompanhe sua Ordem de Serviço aqui: ${selectedOrder.publicLink}`)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 text-emerald-600 font-bold hover:underline text-sm flex items-center bg-emerald-50 px-4 py-2 rounded-lg"
                >
                    Enviar via WhatsApp <Share2 size={16} className="ml-2"/>
                </a>
            </div>
        )}
      </Modal>

       {/* Receipt Modal */}
        {isReceiptModalOpen && receiptOrderData && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
             <div className="p-6 overflow-y-auto bg-gray-50 max-h-[80vh]">
                <ServiceOrderReceiptView order={receiptOrderData} company={MOCK_COMPANIES[0]} />
             </div>
             <div className="flex justify-between items-center p-4 border-t bg-white no-print">
               <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-2">
                    <X size={18} />
                    Fechar
               </button>
               <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors shadow-md font-bold">
                   <Printer size={18} className="mr-2" />
                   Imprimir
               </button>
             </div>
           </div>
         </div>
      )}
      
      {/* Reprint Receipt Modal */}
      {isReprintModalOpen && orderToReprint && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
             <div className="p-6 overflow-y-auto bg-gray-50 max-h-[80vh]">
                <ServiceOrderReceiptView order={orderToReprint} company={MOCK_COMPANIES[0]} />
             </div>
             <div className="flex justify-between items-center p-4 border-t bg-white no-print">
               <button onClick={() => setIsReprintModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-2">
                    <X size={18} />
                    Fechar
               </button>
               <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors shadow-md font-bold">
                   <Printer size={18} className="mr-2" />
                   Imprimir
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Media Preview Modal */}
      <Modal isOpen={mediaPreview !== null} onClose={() => setMediaPreview(null)} title="Visualizador de Mídia" size="3xl">
        {mediaPreview && (
            <div className="bg-black rounded-lg p-1 flex justify-center items-center h-[60vh]">
                {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="Visualização da imagem" className="max-h-full max-w-full object-contain" />
                ) : (
                    <video src={mediaPreview.url} controls autoPlay className="max-h-full max-w-full">
                        Seu navegador não suporta a tag de vídeo.
                    </video>
                )}
            </div>
        )}
      </Modal>
    </div>
  );
};

export default ElectronicsServiceOrders;
