
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SERVICE_ORDERS, MOCK_ELECTRONICS_SERVICE_ORDERS, MOCK_AUTOMOTIVE_SERVICE_ORDERS, MOCK_SECURITY_SERVICE_ORDERS, MOCK_SOLAR_ENERGY_SERVICE_ORDERS, MOCK_IT_CONSULTING_SERVICE_ORDERS, MOCK_CUSTOMERS } from '../constants';
import { ServiceOrderStatus, type ServiceOrder, type InvoiceItem, type AppSettings, type Company } from '../types';
import { PlusCircle, Trash2, FileText, ShieldAlert, Package, Receipt, CheckCircle2, Building2, Search, User, FileBadge, ArrowRight, AlertTriangle } from 'lucide-react';

type InvoiceType = 'NFe' | 'NFSe' | 'NFCe';

const formatCurrency = (value: number | null | undefined): string => {
  const numberValue = Number(value);
  if (value === null || typeof value === 'undefined' || isNaN(numberValue)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};

interface InvoiceIssuingProps {
  settings: AppSettings;
  companies: Company[];
}

const InvoiceIssuing: React.FC<InvoiceIssuingProps> = ({ settings, companies }) => {
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('NFSe');
    const [selectedOS, setSelectedOS] = useState<string>('');
    const [selectedIssuer, setSelectedIssuer] = useState<string>(companies.length > 0 ? companies[0].id : '');
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
            setTakerMunicipalRegistration(''); 
            setServiceCode('14.01');

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
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.totalPrice = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.unitPrice) || 0);
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleItemCurrencyChange = (id: number, rawValue: string) => {
        const onlyNumbers = rawValue.replace(/[^\d]/g, '');
        const numericValue = onlyNumbers ? parseFloat(onlyNumbers) / 100 : 0;
        handleItemChange(id, 'unitPrice', numericValue);
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
        items.reduce((acc, item) => acc + item.totalPrice, 0),
    [items]);
    
    const handleIssueInvoice = () => {
        const issuer = companies.find(c => c.id === selectedIssuer);
        if (!issuer) {
            alert('Por favor, selecione uma empresa emissora.');
            return;
        }

        if (!issuer.hasCertificate) {
            alert('A empresa emissora selecionada não possui um certificado digital válido. Por favor, faça o upload na página "Certificado Digital" antes de emitir notas.');
            return;
        }

        if (!customerName || items.length === 0) {
            alert('Por favor, preencha os dados do cliente e adicione pelo menos um item.');
            return;
        }

        let message = `Simulação de Emissão de ${invoiceType}:\nEmissor: ${issuer.name}\nCliente: ${customerName}\nTotal: ${formatCurrency(subtotal)}`;
        if (invoiceType === 'NFSe') {
            message += `\nCódigo Serviço: ${serviceCode}\nObs: ${serviceObservations}`;
        }
        message += `\n\nEm um ambiente real, a requisição para a API (nfe-sped) seria feita aqui.`;

        alert(message);
        // Reset or redirect logic could go here
    };

    const currentIssuer = companies.find(c => c.id === selectedIssuer);

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Emissão de Notas Fiscais</h1>
            <p className="text-gray-500 mb-8">Configure e emita seus documentos fiscais de forma simples e rápida.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Configuration */}
                <div className="space-y-6">
                    {/* Step 1: Issuer */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-primary font-bold">1</div>
                            <h2 className="text-lg font-semibold text-gray-800">Quem está emitindo?</h2>
                        </div>
                        
                        <label className="block text-sm font-medium text-gray-600 mb-2">Empresa Emissora</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={selectedIssuer}
                                onChange={(e) => setSelectedIssuer(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {currentIssuer && (
                            <div className={`mt-4 p-4 rounded-lg border ${currentIssuer.hasCertificate ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{currentIssuer.legalName}</p>
                                        <p className="text-xs text-gray-500 mt-1">CNPJ: {currentIssuer.document}</p>
                                    </div>
                                    {currentIssuer.hasCertificate ? (
                                        <CheckCircle2 size={18} className="text-green-600" />
                                    ) : (
                                        <AlertTriangle size={18} className="text-yellow-600" />
                                    )}
                                </div>
                                {!currentIssuer.hasCertificate && (
                                    <p className="text-xs text-yellow-700 mt-2 flex items-center">
                                        <ShieldAlert size={12} className="mr-1"/> Certificado digital pendente.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Type */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-primary font-bold">2</div>
                            <h2 className="text-lg font-semibold text-gray-800">Tipo de Documento</h2>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => setInvoiceType('NFSe')}
                                className={`w-full flex items-center p-3 rounded-lg border transition-all text-left ${
                                    invoiceType === 'NFSe' ? 'border-primary bg-indigo-50 ring-1 ring-primary' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`p-2 rounded-full mr-3 ${invoiceType === 'NFSe' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${invoiceType === 'NFSe' ? 'text-primary' : 'text-gray-700'}`}>NFSe (Serviço)</p>
                                    <p className="text-xs text-gray-500">Para prestação de serviços</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setInvoiceType('NFe')}
                                className={`w-full flex items-center p-3 rounded-lg border transition-all text-left ${
                                    invoiceType === 'NFe' ? 'border-primary bg-indigo-50 ring-1 ring-primary' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`p-2 rounded-full mr-3 ${invoiceType === 'NFe' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${invoiceType === 'NFe' ? 'text-primary' : 'text-gray-700'}`}>NFe (Produto)</p>
                                    <p className="text-xs text-gray-500">Venda de mercadorias (Danfe)</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setInvoiceType('NFCe')}
                                className={`w-full flex items-center p-3 rounded-lg border transition-all text-left ${
                                    invoiceType === 'NFCe' ? 'border-primary bg-indigo-50 ring-1 ring-primary' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`p-2 rounded-full mr-3 ${invoiceType === 'NFCe' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${invoiceType === 'NFCe' ? 'text-primary' : 'text-gray-700'}`}>NFCe (Cupom)</p>
                                    <p className="text-xs text-gray-500">Venda direta ao consumidor</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Step 3: Reference */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <div className="flex items-center mb-4">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-primary font-bold">3</div>
                            <h2 className="text-lg font-semibold text-gray-800">Referência (Opcional)</h2>
                        </div>
                        
                        <label className="block text-sm font-medium text-gray-600 mb-2">Importar de Ordem de Serviço</label>
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={selectedOS}
                                onChange={(e) => setSelectedOS(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                            >
                                <option value="">-- Selecionar O.S. Concluída --</option>
                                {completedServiceOrders.map(os => (
                                    <option key={os.id} value={os.id}>
                                        {os.id} - {os.customerName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedOS && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                                <p className="text-blue-800 font-medium flex items-center gap-2"><CheckCircle2 size={14}/> Dados importados!</p>
                                <p className="text-blue-600 mt-1 text-xs">Os itens e valores foram preenchidos automaticamente com base na O.S. selecionada.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Form Details */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center mb-6">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-primary font-bold">4</div>
                            <h2 className="text-lg font-semibold text-gray-800">Detalhes da Nota</h2>
                        </div>

                        {/* Client Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Cliente / Tomador</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Nome do cliente" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">CPF / CNPJ</label>
                                <div className="relative">
                                    <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" value={customerDoc} onChange={e => setCustomerDoc(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Documento" />
                                </div>
                            </div>
                        </div>

                        {/* NFSe Specifics */}
                        {invoiceType === 'NFSe' && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <FileText size={16} /> Dados do Serviço (ISS)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cód. Serviço (LC 116)</label>
                                        <input type="text" value={serviceCode} onChange={e => setServiceCode(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Ex: 14.01" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Inscrição Municipal Tomador</label>
                                        <input type="text" value={takerMunicipalRegistration} onChange={e => setTakerMunicipalRegistration(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Opcional" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Observações / Discriminação</label>
                                    <textarea value={serviceObservations} onChange={e => setServiceObservations(e.target.value)} rows={3} className="w-full p-2 border rounded-md text-sm" placeholder="Detalhes do serviço..." />
                                </div>
                            </div>
                        )}

                        {/* Items Table */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-700">Itens da Nota</h3>
                                <button onClick={addItem} className="text-sm text-primary font-bold hover:underline flex items-center">
                                    <PlusCircle size={16} className="mr-1"/> Adicionar Item
                                </button>
                            </div>
                            
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Qtd</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Unit.</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                                                    Nenhum item adicionado.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full p-1 border-b border-transparent focus:border-primary focus:outline-none text-sm"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                            placeholder="Descrição..."
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="number" 
                                                            className="w-full p-1 border-b border-transparent focus:border-primary focus:outline-none text-sm"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="text" 
                                                            className="w-full p-1 border-b border-transparent focus:border-primary focus:outline-none text-sm"
                                                            value={formatCurrency(item.unitPrice)}
                                                            onChange={(e) => handleItemCurrencyChange(item.id, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium text-sm text-gray-700">
                                                        {formatCurrency(item.totalPrice)}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals & Action */}
                        <div className="flex flex-col items-end border-t pt-6">
                            <div className="text-right mb-6">
                                <span className="text-gray-500 text-sm uppercase font-bold mr-4">Valor Total</span>
                                <span className="text-4xl font-extrabold text-gray-800">{formatCurrency(subtotal)}</span>
                            </div>
                            
                            <button 
                                onClick={handleIssueInvoice}
                                disabled={!currentIssuer?.hasCertificate}
                                className="bg-primary text-white px-8 py-4 rounded-xl flex items-center hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Emitir {invoiceType}
                                <ArrowRight size={20} className="ml-2"/>
                            </button>
                            {!currentIssuer?.hasCertificate && (
                                <p className="text-xs text-red-500 mt-2">Certificado digital obrigatório para emissão.</p>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceIssuing;
