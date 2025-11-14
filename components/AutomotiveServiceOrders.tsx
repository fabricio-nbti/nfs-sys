import React, { useState, useMemo } from 'react';
import { MOCK_AUTOMOTIVE_SERVICE_ORDERS } from '../constants';
import { type ServiceOrder, ServiceOrderStatus } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Eye, Share2, ClipboardCopy, UploadCloud, Image as ImageIcon, Video, X } from 'lucide-react';
import Modal from './shared/Modal';

const statusColorMap: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.Pending]: 'bg-blue-100 text-blue-800',
  [ServiceOrderStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
  [ServiceOrderStatus.WaitingParts]: 'bg-orange-100 text-orange-800',
  [ServiceOrderStatus.Completed]: 'bg-green-100 text-green-800',
  [ServiceOrderStatus.Canceled]: 'bg-red-100 text-red-800',
};

const AutomotiveServiceOrders: React.FC = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(MOCK_AUTOMOTIVE_SERVICE_ORDERS);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const columns = [
    { header: 'Nº O.S.', accessor: 'id' as keyof ServiceOrder },
    { header: 'Cliente', accessor: 'customerName' as keyof ServiceOrder },
    { header: 'Veículo', accessor: (item: ServiceOrder) => `${item.deviceBrand} ${item.deviceModel}` },
    { header: 'Placa', accessor: 'vehiclePlate' as keyof ServiceOrder },
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      alert('Ordem de Serviço salva com sucesso! (Simulação)');
      setIsFormModalOpen(false);
      setSelectedOrder(null);
  };

  const handleFileCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Link copiado para a área de transferência!');
    });
  }

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
        <h1 className="text-3xl font-bold text-gray-800">O.S. - Automotivo</h1>
        <button 
          onClick={() => openFormModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Nova O.S. (Automotivo)
        </button>
      </div>

      <DataTable<ServiceOrder>
        columns={columns}
        data={serviceOrders}
        renderActions={(item) => (
          <div className="flex space-x-2">
            <button onClick={() => openViewModal(item)} className="text-blue-600 hover:text-blue-900" title="Visualizar"><Eye size={18} /></button>
            <button onClick={() => openFormModal(item)} className="text-yellow-600 hover:text-yellow-900" title="Editar"><Edit size={18} /></button>
            <button onClick={() => openLinkModal(item)} className="text-green-600 hover:text-green-900" title="Compartilhar"><Share2 size={18} /></button>
          </div>
        )}
      />

      {/* Form Modal (Create/Edit) */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedOrder ? "Editar Ordem de Serviço" : "Criar Nova Ordem de Serviço"}>
        <form onSubmit={handleFormSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold mb-2 text-primary">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="Nome completo" defaultValue={selectedOrder?.customerName} className="p-2 w-full border rounded-md" required/>
                <input type="tel" placeholder="Telefone" defaultValue={selectedOrder?.customerPhone} className="p-2 w-full border rounded-md"/>
                <input type="email" placeholder="E-mail" defaultValue={selectedOrder?.customerEmail} className="p-2 w-full border rounded-md col-span-2"/>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-primary">Dados do Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select defaultValue={selectedOrder?.deviceType || 'Carro'} className="p-2 w-full border rounded-md bg-white">
                    <option>Carro</option>
                    <option>Moto</option>
                    <option>Caminhão</option>
                    <option>Outro</option>
                </select>
                <input type="text" placeholder="Marca" defaultValue={selectedOrder?.deviceBrand} className="p-2 w-full border rounded-md" required/>
                <input type="text" placeholder="Modelo" defaultValue={selectedOrder?.deviceModel} className="p-2 w-full border rounded-md" required/>
                <input type="text" placeholder="Ano/Modelo" defaultValue={selectedOrder?.year} className="p-2 w-full border rounded-md"/>
                <input type="text" placeholder="Placa" defaultValue={selectedOrder?.vehiclePlate} className="p-2 w-full border rounded-md" required/>
                <input type="text" placeholder="Chassi (VIN)" defaultValue={selectedOrder?.imeiOrSerial} className="p-2 w-full border rounded-md col-span-2"/>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-primary">Serviço</h3>
             <div className="grid grid-cols-1 gap-4 mb-4">
                <textarea placeholder="Problema Relatado / Serviço Solicitado" defaultValue={selectedOrder?.reportedProblem} rows={3} className="p-2 w-full border rounded-md" required></textarea>
                <textarea placeholder="Observações do Mecânico" defaultValue={selectedOrder?.technicianNotes} rows={3} className="p-2 w-full border rounded-md"></textarea>
                <textarea placeholder="Peças Utilizadas" defaultValue={selectedOrder?.partsUsed} rows={3} className="p-2 w-full border rounded-md"></textarea>
                <div className="flex gap-4">
                    <input type="number" step="0.01" placeholder="Custo do Serviço (R$)" defaultValue={selectedOrder?.serviceCost} className="p-2 w-full border rounded-md"/>
                    <input type="number" step="0.01" placeholder="Custo das Peças (R$)" defaultValue={selectedOrder?.partsCost} className="p-2 w-full border rounded-md"/>
                </div>
             </div>

            <h3 className="text-lg font-semibold mb-2 text-primary">Fotos e Vídeos do Veículo</h3>
            <div>
                <label htmlFor="file-upload-auto" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                    <UploadCloud className="w-8 h-8 text-gray-400"/>
                    <span className="mt-2 text-sm text-gray-600">Clique para selecionar arquivos</span>
                </label>
                <input id="file-upload-auto" type="file" multiple className="hidden" onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}/>
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
            <p><strong>Veículo:</strong> {`${selectedOrder.deviceBrand} ${selectedOrder.deviceModel} (${selectedOrder.year})`}</p>
            <p><strong>Placa:</strong> {selectedOrder.vehiclePlate}</p>
            <p><strong>Serviço Solicitado:</strong> {selectedOrder.reportedProblem}</p>
            <p><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[selectedOrder.status]}`}>{selectedOrder.status}</span></p>
            {selectedOrder.technicianNotes && <p><strong>Notas do Mecânico:</strong> {selectedOrder.technicianNotes}</p>}
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

    </div>
  );
};

export default AutomotiveServiceOrders;