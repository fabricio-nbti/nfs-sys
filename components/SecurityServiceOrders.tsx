










import React, { useState, useMemo } from 'react';
import { MOCK_SECURITY_SERVICE_ORDERS, MOCK_COMPANIES } from '../constants';
import { type ServiceOrder, ServiceOrderStatus, type DamageMarker } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Eye, Share2, ClipboardCopy, UploadCloud, Image as ImageIcon, Video, X, Trash2, Printer, Undo2 } from 'lucide-react';
import Modal from './shared/Modal';
import ServiceOrderReceiptView from './shared/ServiceOrderReceiptView';
import WireframeAnnotator from './shared/WireframeAnnotator';


const statusColorMap: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.Pending]: 'bg-blue-100 text-blue-800',
  [ServiceOrderStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
  [ServiceOrderStatus.WaitingParts]: 'bg-orange-100 text-orange-800',
  [ServiceOrderStatus.Completed]: 'bg-green-100 text-green-800',
  [ServiceOrderStatus.Canceled]: 'bg-red-100 text-red-800',
};

const SecurityServiceOrders: React.FC = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(MOCK_SECURITY_SERVICE_ORDERS);
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

  const columns = [
    { header: 'Nº O.S.', accessor: 'id' as keyof ServiceOrder },
    { header: 'Cliente', accessor: 'customerName' as keyof ServiceOrder },
    { header: 'Tipo de Serviço', accessor: 'deviceType' as keyof ServiceOrder },
    { header: 'Data Entrada', accessor: 'creationDate' as keyof ServiceOrder },
    { header: 'Data Conclusão', accessor: (item: ServiceOrder) => item.dataConclusao ? new Date(item.dataConclusao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---' },
    {
      header: 'Status',
      accessor: (item: ServiceOrder) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[item.status]}`}>
          {item.status}
        </span>
      ),
    },
    { header: 'Valor Total', accessor: (item: ServiceOrder) => item.totalValue ? `R$ ${item.totalValue.toFixed(2)}` : 'A definir' },
  ];

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
              alert('Ordem de Serviço atualizada com sucesso! (Simulação)');
              setIsFormModalOpen(false);
              setCurrentOrder(null);
          } else { // Create new order
              const timestamp = Date.now();
              const newOrder = {
                  ...currentOrder,
                  id: `OSS-${timestamp}`,
                  creationDate: new Date().toISOString().split('T')[0],
                  publicLink: `https://example.com/os/view/oss-${timestamp}`,
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
    if (window.confirm(`Tem certeza que deseja reabrir a O.S. #${orderToReopen.id}? O status será alterado para 'Em Andamento' e a data de conclusão será removida.`)) {
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
            <div key={index} className="relative aspect-square border rounded-md p-1 flex items-center justify-center">
                {file.type.startsWith('image/') ? <ImageIcon className="w-8 h-8 text-gray-400" /> : <Video className="w-8 h-8 text-gray-400" />}
                <p className="absolute bottom-1 text-xs truncate w-full px-1 text-center">{file.name}</p>
                <button 
                    type="button" 
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    onClick={() => setUploadedFiles(files => files.filter(f => f.name !== file.name))}
                >
                    <X size={12} />
                </button>
            </div>
        ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">O.S. - Segurança Eletrônica</h1>
        <button 
          onClick={() => openFormModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Nova O.S. (Segurança)
        </button>
      </div>

      {selection.length > 0 && (
         <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 p-4 mb-4 rounded-r-lg flex justify-between items-center">
            <span>{selection.length} selecionado(s)</span>
            <div>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 flex items-center"
              >
                <Trash2 size={16} className="mr-1" />
                Excluir Selecionadas
              </button>
            </div>
          </div>
      )}

      <DataTable<ServiceOrder>
        columns={columns}
        data={serviceOrders}
        selection={selection}
        onSelectionChange={setSelection}
        renderActions={(item) => (
          <div className="flex space-x-2">
            <button onClick={() => openViewModal(item)} className="text-blue-600 hover:text-blue-900" title="Visualizar"><Eye size={18} /></button>
            
            {item.status !== ServiceOrderStatus.Completed && item.status !== ServiceOrderStatus.Canceled && (
              <button onClick={() => openFormModal(item)} className="text-yellow-600 hover:text-yellow-900" title="Editar"><Edit size={18} /></button>
            )}

            {item.status === ServiceOrderStatus.Completed && (
              <button onClick={() => handleReopenOrder(item)} className="text-purple-600 hover:text-purple-900" title="Reabrir O.S."><Undo2 size={18} /></button>
            )}
            
            <button onClick={() => openLinkModal(item)} className="text-green-600 hover:text-green-900" title="Compartilhar"><Share2 size={18} /></button>
            <button onClick={() => openReprintModal(item)} className="text-gray-600 hover:text-gray-900" title="Imprimir Comprovante"><Printer size={18} /></button>
          </div>
        )}
      />

      {/* Form Modal (Create/Edit) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={currentOrder?.id ? "Editar Ordem de Serviço" : "Criar Nova Ordem de Serviço"} size="4xl">
        <form onSubmit={handleFormSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-primary">Dados do Cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="customerNameSec" className="block text-sm font-medium text-gray-700">Nome do Cliente/Condomínio</label>
                                <input type="text" id="customerNameSec" name="customerName" value={currentOrder?.customerName || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" required/>
                            </div>
                            <div>
                                <label htmlFor="customerPhoneSec" className="block text-sm font-medium text-gray-700">Telefone</label>
                                <input type="tel" id="customerPhoneSec" name="customerPhone" value={currentOrder?.customerPhone || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="customerEmailSec" className="block text-sm font-medium text-gray-700">E-mail</label>
                                <input type="email" id="customerEmailSec" name="customerEmail" value={currentOrder?.customerEmail || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md"/>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-primary">Dados da Instalação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="deviceTypeSec" className="block text-sm font-medium text-gray-700">Tipo de Serviço</label>
                                <select id="deviceTypeSec" name="deviceType" value={currentOrder?.deviceType || 'Sistema de CFTV'} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md bg-white">
                                    <option>Sistema de CFTV</option>
                                    <option>Alarme Monitorado</option>
                                    <option>Cerca Elétrica</option>
                                    <option>Controle de Acesso</option>
                                    <option>Interfonia</option>
                                    <option>Outro</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="deviceBrandSec" className="block text-sm font-medium text-gray-700">Marca (Intelbras, Hikvision...)</label>
                                <input type="text" id="deviceBrandSec" name="deviceBrand" value={currentOrder?.deviceBrand || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" required/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="deviceModelSec" className="block text-sm font-medium text-gray-700">Modelo (DVR, Câmera, Sensor...)</label>
                                <input type="text" id="deviceModelSec" name="deviceModel" value={currentOrder?.deviceModel || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" required/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="imeiOrSerialSec" className="block text-sm font-medium text-gray-700">Endereço da Instalação</label>
                                <input type="text" id="imeiOrSerialSec" name="imeiOrSerial" value={currentOrder?.imeiOrSerial || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="accessoriesSec" className="block text-sm font-medium text-gray-700">Observações sobre o local</label>
                                <textarea id="accessoriesSec" name="accessories" placeholder="ex: pontos de instalação" value={currentOrder?.accessories || ''} onChange={handleInputChange} rows={2} className="mt-1 p-2 w-full border rounded-md"></textarea>
                            </div>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2 text-primary">Fotos do Local/Serviço</h3>
                        <label htmlFor="file-upload-security" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                            <UploadCloud className="w-8 h-8 text-gray-400"/>
                            <span className="mt-2 text-sm text-gray-600">Clique para selecionar arquivos</span>
                        </label>
                        <input id="file-upload-security" type="file" multiple className="hidden" onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}/>
                        {renderMediaPreview()}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                     <div>
                        <h3 className="text-lg font-semibold mb-2 text-primary">Diagrama de Instalação/Avarias</h3>
                        <p className="text-sm text-gray-500 mb-2">Clique no diagrama para marcar pontos de instalação, defeitos, etc.</p>
                        {currentOrder && (
                        <WireframeAnnotator 
                            deviceType={currentOrder.deviceType || 'Sistema de CFTV'}
                            markers={currentOrder.damageMarkers || []}
                            onMarkersChange={handleMarkersChange}
                            mode="edit"
                        />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Full Width Section */}
            <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2 text-primary">Serviço e Valores</h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" value={currentOrder?.status || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md bg-white mt-1">
                            {Object.values(ServiceOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        </div>
                        {currentOrder?.status === ServiceOrderStatus.Completed ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Conclusão</label>
                            <input type="date" name="dataConclusao" value={currentOrder?.dataConclusao || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md mt-1"/>
                        </div>
                        ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Previsão de Entrega</label>
                            <input type="date" name="estimatedDeliveryDate" value={currentOrder?.estimatedDeliveryDate || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md mt-1"/>
                        </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="reportedProblemSec" className="block text-sm font-medium text-gray-700">Serviço Solicitado pelo Cliente</label>
                        <textarea id="reportedProblemSec" name="reportedProblem" value={currentOrder?.reportedProblem || ''} onChange={handleInputChange} rows={3} className="mt-1 p-2 w-full border rounded-md" required></textarea>
                    </div>
                    <div>
                        <label htmlFor="technicianNotesSec" className="block text-sm font-medium text-gray-700">Observações Técnicas / Laudo</label>
                        <textarea id="technicianNotesSec" name="technicianNotes" value={currentOrder?.technicianNotes || ''} onChange={handleInputChange} rows={3} className="mt-1 p-2 w-full border rounded-md"></textarea>
                    </div>
                    <div>
                        <label htmlFor="partsUsedSec" className="block text-sm font-medium text-gray-700">Equipamentos e Materiais Utilizados</label>
                        <textarea id="partsUsedSec" name="partsUsed" value={currentOrder?.partsUsed || ''} onChange={handleInputChange} rows={3} className="mt-1 p-2 w-full border rounded-md"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Custo Serviço (R$)</label>
                            <input type="number" name="serviceCost" step="0.01" placeholder="Ex: 150.00" value={currentOrder?.serviceCost || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md mt-1"/>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Custo Peças (R$)</label>
                            <input type="number" name="partsCost" step="0.01" placeholder="Ex: 300.50" value={currentOrder?.partsCost || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md mt-1"/>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Garantia (meses)</label>
                            <input type="number" name="warrantyMonths" placeholder="Ex: 3" value={currentOrder?.warrantyMonths || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md mt-1"/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar Ordem</button>
            </div>
        </form>
      </Modal>

      {/* View Modal */}
       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalhes da O.S. - ${selectedOrder?.id}`}>
        {selectedOrder && (
          <div className="text-sm text-gray-700 space-y-3 max-h-[80vh] overflow-y-auto pr-2">
            <p><strong>Cliente:</strong> {selectedOrder.customerName}</p>
            <p><strong>Sistema:</strong> {`${selectedOrder.deviceType} ${selectedOrder.deviceBrand} ${selectedOrder.deviceModel}`}</p>
            <p><strong>Local:</strong> {selectedOrder.imeiOrSerial}</p>
            <p><strong>Serviço Solicitado:</strong> {selectedOrder.reportedProblem}</p>
            <p><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[selectedOrder.status]}`}>{selectedOrder.status}</span></p>
            {selectedOrder.dataConclusao && <p><strong>Data de Conclusão:</strong> {new Date(selectedOrder.dataConclusao).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
            {typeof selectedOrder.warrantyMonths === 'number' && <p><strong>Garantia:</strong> {selectedOrder.warrantyMonths > 0 ? `${selectedOrder.warrantyMonths} meses` : 'Sem garantia'}</p>}
            {selectedOrder.technicianNotes && <p><strong>Notas do Técnico:</strong> {selectedOrder.technicianNotes}</p>}
            {selectedOrder.totalValue && <p><strong>Valor Total:</strong> R$ {selectedOrder.totalValue.toFixed(2)}</p>}
            
            {selectedOrder.damageMarkers && selectedOrder.damageMarkers.length > 0 && (
                <div className="my-4">
                    <h4 className="font-bold text-gray-800 mb-2">Diagrama de Avarias</h4>
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
            <div className="pt-4 flex justify-end">
                 <button type="button" onClick={() => setIsViewModalOpen(false)} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Fechar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Link Modal */}
      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Link para Cliente">
        {selectedOrder && (
            <div className="flex flex-col items-center text-center">
                <p className="mb-4">Compartilhe este QR Code ou link com o cliente para que ele possa acompanhar o status do serviço.</p>
                <div className="p-2 border rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code para a Ordem de Serviço" />
                </div>
                <div className="mt-4 w-full relative">
                    <input type="text" readOnly value={selectedOrder.publicLink} className="w-full p-2 pr-10 border rounded-md bg-gray-100"/>
                    <button onClick={() => handleFileCopy(selectedOrder.publicLink || '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary">
                        <ClipboardCopy size={20} />
                    </button>
                </div>
            </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      {isReceiptModalOpen && receiptOrderData && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-sm flex flex-col">
             <div className="p-4 overflow-y-auto">
                <ServiceOrderReceiptView order={receiptOrderData} company={MOCK_COMPANIES[0]} />
             </div>
             <div className="flex justify-between items-center p-4 border-t bg-white rounded-b-lg no-print">
               <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2">
                    <X size={18} />
                    Fechar
               </button>
               <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                   <Printer size={18} className="mr-2" />
                   Imprimir Comprovante
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Reprint Receipt Modal */}
      {isReprintModalOpen && orderToReprint && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-sm flex flex-col">
             <div className="p-4 overflow-y-auto">
                <ServiceOrderReceiptView order={orderToReprint} company={MOCK_COMPANIES[0]} />
             </div>
             <div className="flex justify-between items-center p-4 border-t bg-white rounded-b-lg no-print">
               <button onClick={() => setIsReprintModalOpen(false)} className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2">
                    <X size={18} />
                    Fechar
               </button>
               <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                   <Printer size={18} className="mr-2" />
                   Imprimir Comprovante
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Media Preview Modal */}
      <Modal isOpen={mediaPreview !== null} onClose={() => setMediaPreview(null)} title="Visualizador de Mídia" size="3xl">
        {mediaPreview && (
            <div className="bg-gray-900 rounded-lg p-2">
                {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="Visualização da imagem" className="max-h-[75vh] w-auto mx-auto rounded-lg" />
                ) : (
                    <video src={mediaPreview.url} controls autoPlay className="max-h-[75vh] w-full rounded-lg focus:outline-none">
                        Seu navegador não suporta a tag de vídeo.
                    </video>
                )}
            </div>
        )}
      </Modal>
    </div>
  );
};

export default SecurityServiceOrders;