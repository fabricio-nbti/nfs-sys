import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SERVICE_ORDERS, MOCK_ELECTRONICS_SERVICE_ORDERS, MOCK_AUTOMOTIVE_SERVICE_ORDERS, MOCK_SECURITY_SERVICE_ORDERS, MOCK_SOLAR_ENERGY_SERVICE_ORDERS, MOCK_IT_CONSULTING_SERVICE_ORDERS, MOCK_CUSTOMERS } from '../constants';
import { ServiceOrderStatus, type ServiceOrder, type InvoiceItem, type AppSettings } from '../types';
import { PlusCircle, Trash2, FileText } from 'lucide-react';

type InvoiceType = 'NFe' | 'NFSe' | 'NFCe';

interface InvoiceIssuingProps {
  settings: AppSettings;
}

const InvoiceIssuing: React.FC<InvoiceIssuingProps> = ({ settings }) => {
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('NFSe');
    const [selectedOS, setSelectedOS] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [customerDoc, setCustomerDoc] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    
    // State for NFSe specific fields
    const [takerMunicipalRegistration, setTakerMunicipalRegistration] = useState('');
    const [serviceCode, setServiceCode] = useState('14.01'); // Default for IT/repair services
    const [serviceObservations, setServiceObservations] = useState('');

    const allServiceOrders = useMemo(() => {
        const orders: ServiceOrder[] = [];
        if (settings.showMobileRepair) orders.push(...MOCK_SERVICE_ORDERS);
        if (settings.showElectronicsRepair) orders.push(...MOCK_ELECTRONICS_SERVICE_ORDERS);
        if (settings.showAutomotiveRepair) orders.push(...MOCK_AUTOMOTIVE_SERVICE_ORDERS);
        if (settings.showSecuritySystems) orders.push(...MOCK_SECURITY_SERVICE_ORDERS);
        if (settings.showSolarEnergy) orders.push(...MOCK_SOLAR_ENERGY_SERVICE_ORDERS);
        if (settings.showITConsulting) orders.push(...MOCK_IT_CONSULTING_SERVICE_ORDERS);
        return orders;
    }, [settings]);

    const completedServiceOrders = useMemo(() => 
        allServiceOrders.filter(os => os.status === ServiceOrderStatus.Completed),
    [allServiceOrders]);

    useEffect(() => {
        if (!selectedOS) {
            setCustomerName('');
            setCustomerDoc('');
            setItems([]);
            setTakerMunicipalRegistration('');
            setServiceCode('14.01');
            setServiceObservations('');
            return;
        };
        
        const order = allServiceOrders.find(o => o.id === selectedOS);
        if (order) {
            setCustomerName(order.customerName);
            const customer = MOCK_CUSTOMERS.find(c => c.name === order.customerName);
            setCustomerDoc(customer?.document || '');

            // Pre-fill NFSe specific fields from OS
            const observations = `Serviço referente à O.S. ${order.id}. Problema relatado: ${order.reportedProblem}. Laudo técnico: ${order.technicianNotes || 'N/A'}.`;
            setServiceObservations(observations);
            setTakerMunicipalRegistration(''); // This info is not in our mock customer data
            setServiceCode('14.01'); // Common code for repair services

            const newItems: InvoiceItem[] = [];
            if (order.serviceCost) {
                newItems.push({
                    id: Date.now(),
                    description: `Mão de obra referente à OS ${order.id}`,
                    quantity: 1,
                    unitPrice: order.serviceCost,
                    code: 'SERV-01',
                    ncm: '00',
                    csosn: '102',
                    cfop: '5933',
                    unit: 'SV',
                    totalPrice: order.serviceCost,
                });
            }
            if (order.partsCost && order.partsCost > 0) {
                newItems.push({
                    id: Date.now() + 1,
                    description: `Peças utilizadas na OS ${order.id} (${order.partsUsed || 'Diversas'})`,
                    quantity: 1,
                    unitPrice: order.partsCost,
                    code: 'PEC-01',
                    ncm: '85177099', // Example NCM for parts
                    csosn: '102',
                    cfop: '5102',
                    unit: 'UN',
                    totalPrice: order.partsCost,
                });
            }
            setItems(newItems);
            setInvoiceType('NFSe'); // Default to service invoice when loading from OS
        }
    }, [selectedOS, allServiceOrders]);

    const handleItemChange = (id: number, field: keyof InvoiceItem, value: string | number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        const newItem: InvoiceItem = { 
            id: Date.now(), 
            description: '', 
            quantity: 1, 
            unitPrice: 0, 
            totalPrice: 0,
            code: 'PROD',
            ncm: '00000000',
            csosn: '102',
            cfop: '5102',
            unit: 'UN',
        };
        setItems(prev => [...prev, newItem]);
    };

    const removeItem = (id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = useMemo(() => 
        items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
    [items]);
    
    const handleIssueInvoice = () => {
        if (!customerName || items.length === 0) {
            alert('Por favor, preencha os dados do cliente e adicione pelo menos um item.');
            return;
        }
        let message = `Simulação de Emissão de ${invoiceType}:\nCliente: ${customerName}\nTotal: R$ ${subtotal.toFixed(2)}`;
        if (invoiceType === 'NFSe') {
            message += `\nCódigo Serviço: ${serviceCode}\nObs: ${serviceObservations}`;
        }
        message += `\n\nEm um ambiente real, a requisição para a API (nfe-sped) seria feita aqui.`;

        alert(message);
        setSelectedOS('');
    };

    const renderTypeButton = (type: InvoiceType, label: string) => (
        <button
            onClick={() => setInvoiceType(type)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors text-sm sm:text-base ${
                invoiceType === type ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Emissão de Notas</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-600">1. Escolha o Tipo de Documento</h2>
                    <div className="flex flex-wrap gap-2">
                        {renderTypeButton('NFSe', 'NFSe (Serviço)')}
                        {renderTypeButton('NFe', 'NFe (Produto)')}
                        {renderTypeButton('NFCe', 'NFCe (Cupom)')}
                    </div>
                </div>

                <div className="mb-6">
                     <h2 className="text-lg font-semibold mb-2 text-gray-600">2. Puxar Dados de O.S. (Opcional)</h2>
                    <select
                        value={selectedOS}
                        onChange={(e) => setSelectedOS(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">-- Emissão Avulsa --</option>
                        {completedServiceOrders.map(os => (
                            <option key={os.id} value={os.id}>
                                O.S. {os.id} - {os.customerName} (R$ {os.totalValue?.toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-600">3. Preencha os Dados da Nota</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Cliente / Tomador do Serviço</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente" className="mt-1 p-2 w-full border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CPF/CNPJ do Tomador</label>
                            <input type="text" value={customerDoc} onChange={e => setCustomerDoc(e.target.value)} placeholder="Documento" className="mt-1 p-2 w-full border rounded-md"/>
                        </div>
                    </div>

                    {invoiceType === 'NFSe' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Inscrição Municipal Tomador</label>
                                <input type="text" value={takerMunicipalRegistration} onChange={e => setTakerMunicipalRegistration(e.target.value)} placeholder="Opcional" className="mt-1 p-2 w-full border rounded-md"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Código do Serviço (LC 116)</label>
                                <input type="text" value={serviceCode} onChange={e => setServiceCode(e.target.value)} placeholder="Ex: 14.01" className="mt-1 p-2 w-full border rounded-md"/>
                            </div>
                        </div>
                    )}

                    <h3 className="text-md font-semibold mb-2 text-gray-600">Itens da Nota</h3>
                    <div className="space-y-2 mb-4">
                        {items.map(item => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                <input 
                                    type="text" 
                                    placeholder="Descrição do item/serviço" 
                                    className="col-span-6 p-2 border rounded-md text-sm"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Qtd." 
                                    className="col-span-2 p-2 border rounded-md text-sm"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                                <input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="Valor Unit." 
                                    className="col-span-3 p-2 border rounded-md text-sm"
                                    value={item.unitPrice}
                                     onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                />
                                <button onClick={() => removeItem(item.id)} className="col-span-1 text-red-500 hover:text-red-700 justify-self-center">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button onClick={addItem} className="flex items-center gap-2 text-sm text-primary font-semibold hover:text-indigo-800">
                        <PlusCircle size={18} /> Adicionar Item
                    </button>
                    
                     {invoiceType === 'NFSe' && (
                        <div className="mt-4">
                            <h3 className="text-md font-semibold mb-2 text-gray-600">Observações do Serviço</h3>
                            <textarea 
                                value={serviceObservations}
                                onChange={e => setServiceObservations(e.target.value)}
                                rows={3}
                                placeholder="Detalhes sobre o serviço prestado, garantia, etc."
                                className="w-full p-2 border rounded-md text-sm"
                            />
                        </div>
                    )}

                    <div className="mt-6 flex justify-end items-center">
                        <span className="text-lg font-bold text-gray-800">Total: R$ {subtotal.toFixed(2)}</span>
                    </div>

                    <div className="mt-8 border-t pt-6 flex justify-end">
                        <button 
                            onClick={handleIssueInvoice}
                            className="bg-secondary text-white px-6 py-3 rounded-lg flex items-center hover:bg-emerald-700 transition-colors font-bold"
                        >
                            <FileText size={20} className="mr-2"/>
                            Emitir {invoiceType}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoiceIssuing;