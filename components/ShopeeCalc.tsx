
import React, { useState, useCallback, useEffect } from 'react';
import { Calculator, Package, Truck, RotateCcw, Award, Info, TrendingUp, DollarSign, Box } from 'lucide-react';

const ShopeeCalc: React.FC = () => {
    // Unified state for inputs
    const [inputs, setInputs] = useState({
        sellerPackages: '' as number | '',
        returnPackages: '' as number | '',
        pickupReceived: '' as number | '',
        pickupDelivered: '' as number | '',
        excellenceLevel: 'none',
    });

    // Unified state for results
    const [result, setResult] = useState<{
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
            [name]: e.target.type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const calculateTieredPackages = useCallback((quantity: number) => {
        if (quantity <= 0) return { total: 0 };
        let totalCost = 0;
        let remaining = quantity;

        const tiers = [
            { limit: 500, price: 0.70 },
            { limit: 500, price: 0.60 }, // 501-1000
            { limit: 4000, price: 0.50 }, // 1001-5000
            { limit: 5000, price: 0.40 }, // 5001-10000
            { limit: 5000, price: 0.30 }, // 10001-15000
            { limit: Infinity, price: 0.20 }, // 15001+
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

        const sellerQty = Number(sellerPackages) || 0;
        const returnQty = Number(returnPackages) || 0;
        const receivedQty = Number(pickupReceived) || 0;
        const deliveredQty = Number(pickupDelivered) || 0;

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

    // Real-time calculation
    useEffect(() => {
        calculateAll();
    }, [calculateAll]);

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

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
                 <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                    <Calculator className="text-primary w-8 h-8" />
                 </div>
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">Calculadora Shopee Xpress</h1>
                    <p className="text-gray-500">Estime seus ganhos como Agência ou Ponto de Coleta</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <InputCard title="Envios (Seller)" icon={<Package size={18}/>} colorClass="bg-blue-500">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pacotes de Vendedores</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        name="sellerPackages"
                                        value={inputs.sellerPackages}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                    <Info size={12} className="mr-1"/> Escalonado (R$ 0,20 a R$ 0,70)
                                </p>
                            </div>
                        </InputCard>

                        <InputCard title="Logística Reversa" icon={<RotateCcw size={18}/>} colorClass="bg-orange-500">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pacotes de Devolução</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        name="returnPackages"
                                        value={inputs.returnPackages}
                                        onChange={handleInputChange}
                                        placeholder="0"
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
                                        type="number"
                                        name="pickupReceived"
                                        value={inputs.pickupReceived}
                                        onChange={handleInputChange}
                                        placeholder="Qtd. do vendedor"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entregues (Outbound)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        name="pickupDelivered"
                                        value={inputs.pickupDelivered}
                                        onChange={handleInputChange}
                                        placeholder="Qtd. ao comprador"
                                        className="w-full pl-3 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">un</span>
                                </div>
                            </div>
                        </div>
                         <p className="text-xs text-gray-500 flex items-center">
                            <Info size={12} className="mr-1"/> Tarifas escalonadas aplicadas separadamente para Recebidos e Entregues.
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
                                        subtext={`${inputs.sellerPackages || 0} pacotes`}
                                    />
                                    <StatRow 
                                        label="Ponto de Coleta" 
                                        value={`R$ ${result.pickupTotal.toFixed(2)}`}
                                        subtext={`${(Number(inputs.pickupReceived) || 0) + (Number(inputs.pickupDelivered) || 0)} movimentações`}
                                    />
                                    <StatRow 
                                        label="Devoluções" 
                                        value={`R$ ${result.returnTotal.toFixed(2)}`}
                                        subtext={`${inputs.returnPackages || 0} pacotes`}
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
                                        *Valores estimados baseados nas tarifas vigentes. Podem ocorrer variações.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <Box size={48} className="mx-auto mb-3 opacity-20"/>
                                    <p>Preencha os campos ao lado para ver o detalhamento.</p>
                                </div>
                            )}
                        </div>
                        
                        {result && result.grandTotal > 0 && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                 <div className="flex items-center text-indigo-600 font-medium text-sm">
                                    <TrendingUp size={16} className="mr-2"/>
                                    Potencial de ganho calculado
                                 </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShopeeCalc;
