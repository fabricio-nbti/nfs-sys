
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Calculator, Package, Truck, RotateCcw, Award, Info, TrendingUp, DollarSign, Box, Calendar, Save, Trash2, History } from 'lucide-react';
import { DataTable } from './shared/DataTable';

interface SavedCalculation {
    id: string;
    type: 'daily' | 'period';
    startDate: string;
    endDate?: string;
    sellerQty: number;
    pickupQty: number;
    returnQty: number;
    totalValue: number;
    createdAt: number;
}

const InputCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; colorClass: string }> = ({ title, icon, children, colorClass }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${colorClass} bg-opacity-10`}>
            <div className={`p-1.5 rounded-md ${colorClass} text-white shadow-sm`}>
                {icon}
            </div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-5 space-y-4">
            {children}
        </div>
    </div>
);

const StatRow: React.FC<{ label: string; value: string; subtext?: string; highlight?: boolean; isBonus?: boolean }> = ({ label, value, subtext, highlight, isBonus }) => (
    <div className={`flex justify-between items-start py-2 border-b border-dashed border-gray-100 last:border-0 ${highlight ? 'bg-gray-50 -mx-4 px-4 py-3 rounded-lg' : ''}`}>
        <div>
            <p className={`text-sm font-medium ${isBonus ? 'text-green-600' : 'text-gray-600'}`}>{label}</p>
            {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
        <div className="text-right">
             <p className={`font-bold ${isBonus ? 'text-green-600' : 'text-gray-800'} ${highlight ? 'text-lg' : ''}`}>{value}</p>
        </div>
    </div>
);

const ShopeeCalc: React.FC = () => {
    // Calculation Settings State
    const [dateConfig, setDateConfig] = useState<{ type: 'daily' | 'period'; startDate: string; endDate: string }>({
        type: 'daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // Inputs State
    const [inputs, setInputs] = useState({
        sellerPackages: '',
        returnPackages: '',
        pickupReceived: '',
        pickupDelivered: '',
        excellenceLevel: 'none',
    });

    // History State
    const [savedHistory, setSavedHistory] = useState<SavedCalculation[]>([]);
    const [historySelection, setHistorySelection] = useState<string[]>([]);

    // Result State
    const [result, setResult] = useState<{
        sellerQty: number;
        returnQty: number;
        pickupQty: number;
        sellerTotal: number;
        returnTotal: number;
        pickupTotal: number;
        subtotal: number;
        bonusLevel: string;
        bonusPercentage: number;
        bonusAmount: number;
        grandTotal: number;
    } | null>(null);

    const excellencePrograms = {
        none: { label: 'Nenhum', percentage: 0 },
        bronze: { label: 'Bronze', percentage: 0.01 },
        prata: { label: 'Prata', percentage: 0.025 },
        ouro: { label: 'Ouro', percentage: 0.035 },
        platina: { label: 'Platina', percentage: 0.05 },
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const parseQuantity = (val: string): number => {
        if (!val) return 0;
        const parts = val.split(/[^0-9]+/).filter(part => part !== '');
        return parts.reduce((acc, part) => acc + parseInt(part, 10), 0);
    };

    const calculateTieredPackages = useCallback((quantity: number) => {
        if (quantity <= 0) return { total: 0 };
        let totalCost = 0;
        let remaining = quantity;

        const tiers = [
            { limit: 500, price: 0.70 },
            { limit: 500, price: 0.60 },
            { limit: 4000, price: 0.50 },
            { limit: 5000, price: 0.40 },
            { limit: 5000, price: 0.30 },
            { limit: Infinity, price: 0.20 },
        ];

        for (const tier of tiers) {
            if (remaining <= 0) break;
            const packagesInTier = Math.min(remaining, tier.limit);
            totalCost += packagesInTier * tier.price;
            remaining -= packagesInTier;
        }
        
        return { total: totalCost };
    }, []);
    
    const calculateAll = useCallback(() => {
        const { sellerPackages, returnPackages, pickupReceived, pickupDelivered, excellenceLevel } = inputs;

        const sellerQty = parseQuantity(sellerPackages);
        const returnQty = parseQuantity(returnPackages);
        const receivedQty = parseQuantity(pickupReceived);
        const deliveredQty = parseQuantity(pickupDelivered);

        const sellerCalc = calculateTieredPackages(sellerQty);
        const returnTotal = returnQty * 0.80;
        const receivedCalc = calculateTieredPackages(receivedQty);
        const deliveredCalc = calculateTieredPackages(deliveredQty);
        const pickupTotal = receivedCalc.total + deliveredCalc.total;

        const subtotal = sellerCalc.total + returnTotal + pickupTotal;

        const programKey = excellenceLevel as keyof typeof excellencePrograms;
        const program = excellencePrograms[programKey] || excellencePrograms.none;
        const bonusAmount = subtotal * program.percentage;
        const grandTotal = subtotal + bonusAmount;

        setResult({
            sellerQty,
            returnQty,
            pickupQty: receivedQty + deliveredQty,
            sellerTotal: sellerCalc.total,
            returnTotal,
            pickupTotal,
            subtotal,
            bonusLevel: program.label,
            bonusPercentage: program.percentage * 100,
            bonusAmount,
            grandTotal,
        });
    }, [inputs, calculateTieredPackages]);

    useEffect(() => {
        calculateAll();
    }, [calculateAll]);

    const handleSaveCalculation = () => {
        if (!result || result.grandTotal === 0) {
            alert("Não há valores calculados para salvar.");
            return;
        }

        const newRecord: SavedCalculation = {
            id: `calc-${Date.now()}`,
            type: dateConfig.type,
            startDate: dateConfig.startDate,
            endDate: dateConfig.type === 'period' ? dateConfig.endDate : undefined,
            sellerQty: result.sellerQty,
            pickupQty: result.pickupQty,
            returnQty: result.returnQty,
            totalValue: result.grandTotal,
            createdAt: Date.now()
        };

        setSavedHistory(prev => [newRecord, ...prev]);
        // Optional: Reset inputs or show feedback?
        // For now, just keeping inputs as is for ease of adjustment.
        alert("Cálculo salvo no histórico!");
    };

    const handleDeleteHistory = (id: string) => {
        if (window.confirm("Excluir este registro?")) {
            setSavedHistory(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleBulkDeleteHistory = () => {
        if (window.confirm(`Excluir ${historySelection.length} registros?`)) {
            setSavedHistory(prev => prev.filter(item => !historySelection.includes(item.id)));
            setHistorySelection([]);
        }
    };

    // Columns for History Table
    const columns = [
        { 
            header: 'Data / Período', 
            accessor: (item: SavedCalculation) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-700">
                        {new Date(item.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {item.type === 'period' && item.endDate && ` até ${new Date(item.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">{item.type === 'daily' ? 'Dia Único' : 'Período'}</span>
                </div>
            )
        },
        { header: 'Seller (Envios)', accessor: (item: SavedCalculation) => `${item.sellerQty} un` },
        { header: 'Pickup (Coleta)', accessor: (item: SavedCalculation) => `${item.pickupQty} un` },
        { header: 'Devoluções', accessor: (item: SavedCalculation) => `${item.returnQty} un` },
        { 
            header: 'Faturamento', 
            accessor: (item: SavedCalculation) => (
                <span className="font-bold text-green-600">
                    {item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            ) 
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
                 <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                    <Calculator className="text-primary w-8 h-8" />
                 </div>
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">Calculadora Shopee Xpress</h1>
                    <p className="text-gray-500">Estime e salve seus ganhos diários ou semanais.</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Date Configuration */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-500"/> Configuração do Cálculo
                            </h3>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setDateConfig(prev => ({ ...prev, type: 'daily' }))}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateConfig.type === 'daily' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                                >
                                    Dia Único
                                </button>
                                <button 
                                    onClick={() => setDateConfig(prev => ({ ...prev, type: 'period' }))}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateConfig.type === 'period' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                                >
                                    Período
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data {dateConfig.type === 'period' ? 'Inicial' : 'do Cálculo'}</label>
                                <input 
                                    type="date" 
                                    value={dateConfig.startDate}
                                    onChange={(e) => setDateConfig(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            {dateConfig.type === 'period' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Final</label>
                                    <input 
                                        type="date" 
                                        value={dateConfig.endDate}
                                        onChange={(e) => setDateConfig(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <InputCard title="Envios (Seller)" icon={<Package size={18}/>} colorClass="bg-blue-500">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pacotes de Vendedores</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        inputMode="text"
                                        name="sellerPackages"
                                        value={inputs.sellerPackages}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 50 + 20 + 10"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                    <Info size={12} className="mr-1"/> Pode somar (ex: 10 20 30)
                                </p>
                            </div>
                        </InputCard>

                        <InputCard title="Logística Reversa" icon={<RotateCcw size={18}/>} colorClass="bg-orange-500">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pacotes de Devolução</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        inputMode="text"
                                        name="returnPackages"
                                        value={inputs.returnPackages}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 5 + 2"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                    <Info size={12} className="mr-1"/> Tarifa fixa: R$ 0,80/un
                                </p>
                            </div>
                        </InputCard>
                    </div>

                    <InputCard title="Ponto de Coleta (Buyer)" icon={<Truck size={18}/>} colorClass="bg-purple-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recebidos (Inbound)</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        inputMode="text"
                                        name="pickupReceived"
                                        value={inputs.pickupReceived}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 15 10"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entregues (Outbound)</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        inputMode="text"
                                        name="pickupDelivered"
                                        value={inputs.pickupDelivered}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 8 + 4"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                            </div>
                        </div>
                         <p className="text-xs text-gray-500 flex items-center mt-2">
                            <Info size={12} className="mr-1"/> Tarifas escalonadas aplicadas separadamente.
                        </p>
                    </InputCard>

                    <InputCard title="Programa de Excelência" icon={<Award size={18}/>} colorClass="bg-emerald-500">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Qualificação</label>
                            <select 
                                name="excellenceLevel"
                                value={inputs.excellenceLevel}
                                onChange={handleInputChange}
                                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            >
                                {Object.entries(excellencePrograms).map(([key, value]) => (
                                    <option key={key} value={key}>{value.label} ({value.percentage * 100}%)</option>
                                ))}
                            </select>
                             <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <Info size={12} className="mr-1"/> Bônus aplicado sobre o total de serviços.
                            </p>
                        </div>
                    </InputCard>
                </div>

                {/* Right Column: Result */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg border border-indigo-50 sticky top-6 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-indigo-700 p-6 text-white text-center">
                            <p className="text-indigo-100 font-medium mb-1 uppercase text-xs tracking-wider">Faturamento Estimado</p>
                            <h2 className="text-4xl font-bold">
                                {result ? `R$ ${result.grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00'}
                            </h2>
                        </div>
                        
                        <div className="p-6 bg-white">
                            {result ? (
                                <div className="space-y-1">
                                    <StatRow 
                                        label="Envios (Seller)" 
                                        value={`R$ ${result.sellerTotal.toFixed(2)}`} 
                                        subtext={`${result.sellerQty} pacotes`}
                                    />
                                    <StatRow 
                                        label="Ponto de Coleta" 
                                        value={`R$ ${result.pickupTotal.toFixed(2)}`}
                                        subtext={`${result.pickupQty} movimentações`}
                                    />
                                    <StatRow 
                                        label="Devoluções" 
                                        value={`R$ ${result.returnTotal.toFixed(2)}`}
                                        subtext={`${result.returnQty} pacotes`}
                                    />
                                    
                                    <div className="py-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-500 text-sm">Subtotal</span>
                                            <span className="text-gray-800 font-semibold">R$ {result.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-md border border-emerald-100">
                                            <span className="text-emerald-700 text-sm font-medium flex items-center">
                                                <Award size={14} className="mr-1"/> Bônus {result.bonusLevel}
                                            </span>
                                            <span className="text-emerald-700 font-bold">+ R$ {result.bonusAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                     <div className="mt-2 text-xs text-gray-400 text-center">
                                        *Valores estimados baseados nas tarifas vigentes.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <Box size={48} className="mx-auto mb-3 opacity-20"/>
                                    <p>Preencha os campos ao lado para ver o detalhamento.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                             <button 
                                onClick={handleSaveCalculation}
                                disabled={!result || result.grandTotal === 0}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <Save size={20} className="mr-2"/> Salvar no Histórico
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <History size={22} className="text-gray-500"/> Histórico de Cálculos
                    </h2>
                    {historySelection.length > 0 && (
                        <button 
                            onClick={handleBulkDeleteHistory}
                            className="text-red-600 text-sm font-semibold hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors flex items-center"
                        >
                            <Trash2 size={16} className="mr-1"/> Excluir Selecionados
                        </button>
                    )}
                </div>
                
                {savedHistory.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <DataTable<SavedCalculation>
                            columns={columns}
                            data={savedHistory}
                            selection={historySelection}
                            onSelectionChange={setHistorySelection}
                            renderActions={(item) => (
                                <button 
                                    onClick={() => handleDeleteHistory(item.id)} 
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400">Nenhum cálculo salvo ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShopeeCalc;
