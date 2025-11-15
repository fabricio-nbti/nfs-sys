import React, { useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';

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
        if (quantity <= 0) return { total: 0, breakdown: "N/A" };
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
    
    const handleCalculate = () => {
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
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Calculadora de Comissões - Agência Shopee</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Inputs */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Valores Base</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Pacotes de Vendedores (Envios)</label>
                                <input 
                                    type="number"
                                    name="sellerPackages"
                                    value={inputs.sellerPackages}
                                    onChange={handleInputChange}
                                    placeholder="Qtd."
                                    className="mt-1 p-2 border rounded-md w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Pacotes de Devolução (R$ 0,80/un)</label>
                                <input 
                                    type="number"
                                    name="returnPackages"
                                    value={inputs.returnPackages}
                                    onChange={handleInputChange}
                                    placeholder="Qtd."
                                    className="mt-1 p-2 border rounded-md w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Pacotes de Retirada (Recebidos)</label>
                                <input 
                                    type="number"
                                    name="pickupReceived"
                                    value={inputs.pickupReceived}
                                    onChange={handleInputChange}
                                    placeholder="Qtd. recebida do vendedor"
                                    className="mt-1 p-2 border rounded-md w-full"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-600">Pacotes de Retirada (Entregues)</label>
                                <input 
                                    type="number"
                                    name="pickupDelivered"
                                    value={inputs.pickupDelivered}
                                    onChange={handleInputChange}
                                    placeholder="Qtd. entregue ao comprador"
                                    className="mt-1 p-2 border rounded-md w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bonus and Action */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Bônus</h3>
                         <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-600">Programa de Excelência</label>
                                <select 
                                    name="excellenceLevel"
                                    value={inputs.excellenceLevel}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 border rounded-md w-full bg-white"
                                >
                                    {Object.entries(excellencePrograms).map(([key, value]) => (
                                        <option key={key} value={key}>{value.label}</option>
                                    ))}
                                </select>
                            </div>
                             <div className="pt-5">
                                <button 
                                    onClick={handleCalculate}
                                    className="bg-primary w-full text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors font-semibold">
                                    <Calculator size={20} className="mr-2"/>
                                    Calcular Ganhos Totais
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Section */}
                {result && (
                    <div className="mt-8 pt-6 border-t">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultado do Cálculo</h2>
                        <div className="bg-indigo-50 p-6 rounded-lg space-y-3">
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Pacotes de Vendedores</span>
                                <span className="font-medium">R$ {result.sellerTotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center text-gray-700">
                                <span>Pacotes de Devolução</span>
                                <span className="font-medium">R$ {result.returnTotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center text-gray-700">
                                <span>Pacotes de Retirada</span>
                                <span className="font-medium">R$ {result.pickupTotal.toFixed(2)}</span>
                            </div>
                            <hr className="my-2"/>
                            <div className="flex justify-between items-center font-semibold text-gray-800">
                                <span>Subtotal</span>
                                <span>R$ {result.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-600">
                                <span>Bônus Excelência ({result.bonusLevel} - {result.bonusPercentage.toLocaleString('pt-BR')}%)</span>
                                <span className="font-medium">+ R$ {result.bonusAmount.toFixed(2)}</span>
                            </div>
                             <hr className="my-2 border-dashed"/>
                            <div className="flex justify-between items-center text-2xl font-bold text-primary">
                                <span>Total Geral</span>
                                <span>R$ {result.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShopeeCalc;