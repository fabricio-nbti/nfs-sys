


import React, { useState, useMemo } from 'react';
import { MOCK_ELECTRONICS_SERVICE_ORDERS, MOCK_COMPANIES } from '../constants';
import { type ServiceOrder, ServiceOrderStatus } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Eye, Share2, ClipboardCopy, UploadCloud, Image as ImageIcon, Video, X, Trash2, Printer } from 'lucide-react';
import Modal from './shared/Modal';
import ServiceOrderReceiptView from './shared/ServiceOrderReceiptView';


const statusColorMap: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.Pending]: 'bg-blue-100 text-blue-800',
  [ServiceOrderStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
  [ServiceOrderStatus.WaitingParts]: 'bg-orange-100 text-orange-800',
  [ServiceOrderStatus.Completed]: 'bg-green-100 text-green-800',
  [ServiceOrderStatus.Canceled]: 'bg-red-100 text-red-800',
};

const ElectronicsServiceOrders: React.FC = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(MOCK_ELECTRONICS_SERVICE_ORDERS);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptOrderData, setReceiptOrderData] = useState<ServiceOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Partial<ServiceOrder> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selection, setSelection] = useState<string[]>([]);

  const columns = [
    { header: 'Nº O.S.', accessor: 'id' as keyof ServiceOrder },
    { header: 'Cliente', accessor: 'customerName' as keyof ServiceOrder },
    { header: 'Equipamento', accessor: (item: ServiceOrder) => `${item.deviceType} ${item.deviceBrand}` },
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
    setCurrentOrder(order ? { ...order } : { status: ServiceOrderStatus.Pending });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentOrder(prev => {
        if (!prev) return null;
        
        let finalValue: any = value;
        if (name === 'serviceCost' || name === 'partsCost') {
            finalValue = value === '' ? undefined : parseFloat(value);
        }

        const updatedOrder = { ...prev, [name]: finalValue };

        if (name === 'status' && value === ServiceOrderStatus.Completed && !updatedOrder.dataConclusao) {
            updatedOrder.dataConclusao = new Date().toISOString().split('T')[0];
        }
        return updatedOrder;
    });
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
        <h1 className="text-3xl font-bold text-gray-800">O.S. - Eletrônicos</h1>
        <button 
          onClick={() => openFormModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Nova O.S. (Eletrônico)
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
            <button onClick={() => openFormModal(item)} className="text-yellow-600 hover:text-yellow-900" title="Editar"><Edit size={18} /></button>
            <button onClick={() => openLinkModal(item)} className="text-green-600 hover:text-green-900" title="Compartilhar"><Share2 size={18} /></button>
          </div>
        )}
      />

      {/* Form Modal (Create/Edit) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={currentOrder?.id ? "Editar Ordem de Serviço" : "Criar Nova Ordem de Serviço"}>
        <form onSubmit={handleFormSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold mb-2 text-primary">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" name="customerName" placeholder="Nome completo" value={currentOrder?.customerName || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md" required/>
                <input type="tel" name="customerPhone" placeholder="Telefone" value={currentOrder?.customerPhone || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md"/>
                <input type="email" name="customerEmail" placeholder="E-mail" value={currentOrder?.customerEmail || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md col-span-2"/>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-primary">Dados do Equipamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select name="deviceType" value={currentOrder?.deviceType || 'TV'} onChange={handleInputChange} className="p-2 w-full border rounded-md bg-white">
                    <option>TV</option>
                    <option>Aparelho de Som</option>
                    <option>Microondas</option>
                    <option>Video Game</option>
                    <option>Outro</option>
                </select>
                <input type="text" name="deviceBrand" placeholder="Marca" value={currentOrder?.deviceBrand || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md" required/>
                <input type="text" name="deviceModel" placeholder="Modelo" value={currentOrder?.deviceModel || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md" required/>
                <input type="text" name="imeiOrSerial" placeholder="Nº de Série" value={currentOrder?.imeiOrSerial || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md"/>
                <textarea name="accessories" placeholder="Acessórios (ex: controle, cabos)" value={currentOrder?.accessories || ''} onChange={handleInputChange} rows={2} className="p-2 w-full border rounded-md col-span-2"></textarea>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-primary">Serviço</h3>
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
                <textarea name="reportedProblem" placeholder="Problema Relatado pelo Cliente" value={currentOrder?.reportedProblem || ''} onChange={handleInputChange} rows={3} className="p-2 w-full border rounded-md" required></textarea>
                <textarea name="technicianNotes" placeholder="Observações do Técnico" value={currentOrder?.technicianNotes || ''} onChange={handleInputChange} rows={3} className="p-2 w-full border rounded-md"></textarea>
                <textarea name="partsUsed" placeholder="Peças Utilizadas" value={currentOrder?.partsUsed || ''} onChange={handleInputChange} rows={3} className="p-2 w-full border rounded-md"></textarea>
                <div className="flex gap-4">
                    <input type="number" name="serviceCost" step="0.01" placeholder="Custo do Serviço (R$)" value={currentOrder?.serviceCost || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md"/>
                    <input type="number" name="partsCost" step="0.01" placeholder="Custo das Peças (R$)" value={currentOrder?.partsCost || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md"/>
                </div>
             </div>

            <h3 className="text-lg font-semibold mb-2 text-primary">Fotos e Vídeos</h3>
            <div>
                <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                    <UploadCloud className="w-8 h-8 text-gray-400"/>
                    <span className="mt-2 text-sm text-gray-600">Clique para selecionar arquivos</span>
                </label>
                <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}/>
                {renderMediaPreview()}
            </div>

            <div className="mt-6 flex justify-end sticky bottom-0 bg-white py-4">
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
            <p><strong>Equipamento:</strong> {`${selectedOrder.deviceType} ${selectedOrder.deviceBrand} ${selectedOrder.deviceModel}`}</p>
            <p><strong>Problema Relatado:</strong> {selectedOrder.reportedProblem}</p>
            <p><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[selectedOrder.status]}`}>{selectedOrder.status}</span></p>
            {selectedOrder.dataConclusao && <p><strong>Data de Conclusão:</strong> {new Date(selectedOrder.dataConclusao).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
            {selectedOrder.technicianNotes && <p><strong>Notas do Técnico:</strong> {selectedOrder.technicianNotes}</p>}
            {selectedOrder.totalValue && <p><strong>Valor Total:</strong> R$ {selectedOrder.totalValue.toFixed(2)}</p>}
            {selectedOrder.mediaUrls && selectedOrder.mediaUrls.length > 0 && (
                <div>
                    <strong>Mídia:</strong>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                        {selectedOrder.mediaUrls.map((url, i) => <img key={i} src={url} alt={`Mídia ${i+1}`} className="w-full h-auto rounded" />)}
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
    </div>
  );
};

export default ElectronicsServiceOrders;