import React, { useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';

const CalculatorCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h2>
        {children}
    </div>
);

const ShopeeCalc: React.FC = () => {
    // State for Seller Packages
    const [sellerPackages, setSellerPackages] = useState<number | ''>('');
    const [sellerResult, setSellerResult] = useState<{ total: number; breakdown: string } | null>(null);

    // State for Return Packages
    const [returnPackages, setReturnPackages] = useState<number | ''>('');
    const [returnResult, setReturnResult] = useState<{ total: number; breakdown: string } | null>(null);

    // State for Pickup Packages
    const [pickupReceived, setPickupReceived] = useState<number | ''>('');
    const [pickupDelivered, setPickupDelivered] = useState<number | ''>('');
    const [pickupResult, setPickupResult] = useState<{ total: number; breakdownReceived: string; breakdownDelivered: string; totalReceived: number; totalDelivered: number; } | null>(null);

    const calculateTieredPackages = useCallback((quantity: number) => {
        if (quantity <= 0) return { total: 0, breakdown: "N/A" };
        let totalCost = 0;
        let remaining = quantity;
        const breakdownParts: string[] = [];

        const tiers = [
            { limit: 500, price: 0.70 },
            { limit: 500, price: 0.60 },    // 501 to 1000
            { limit: 4000, price: 0.50 },   // 1001 to 5000
            { limit: 5000, price: 0.40 },   // 5001 to 10000
            { limit: 5000, price: 0.30 },   // 10001 to 15000
            { limit: Infinity, price: 0.20 },// 15001+
        ];

        for (const tier of tiers) {
            if (remaining <= 0) break;
            
            const packagesInTier = Math.min(remaining, tier.limit);
            const costInTier = packagesInTier * tier.price;
            totalCost += costInTier;
            remaining -= packagesInTier;
            
            if (packagesInTier > 0) {
              breakdownParts.push(`(${packagesInTier} x R$${tier.price.toFixed(2)})`);
            }
        }
        
        return { total: totalCost, breakdown: breakdownParts.join(' + ') };
    }, []);
    
    const handleCalculateSeller = () => {
        const quantity = Number(sellerPackages);
        if (quantity <= 0) {
            setSellerResult(null);
            return;
        }
        setSellerResult(calculateTieredPackages(quantity));
    };

    const handleCalculateReturn = () => {
        const quantity = Number(returnPackages);
        if (quantity <= 0) {
            setReturnResult(null);
            return;
        }
        const total = quantity * 0.80;
        const breakdown = `${quantity} x R$0,80`;
        setReturnResult({ total, breakdown });
    };
    
    const handleCalculatePickup = () => {
        const receivedQty = Number(pickupReceived);
        const deliveredQty = Number(pickupDelivered);

        if (receivedQty <= 0 && deliveredQty <= 0) {
            setPickupResult(null);
            return;
        }

        const receivedCalc = calculateTieredPackages(receivedQty);
        const deliveredCalc = calculateTieredPackages(deliveredQty);
        
        setPickupResult({
            total: receivedCalc.total + deliveredCalc.total,
            totalReceived: receivedCalc.total,
            totalDelivered: deliveredCalc.total,
            breakdownReceived: receivedCalc.breakdown,
            breakdownDelivered: deliveredCalc.breakdown,
        });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Calculadora de Comissões - Agência Shopee</h1>

            {/* Seller Packages Calculator */}
            <CalculatorCard title="Pacotes de Vendedores (Envios)">
                <div className="mb-4 space-y-2 text-sm text-gray-600">
                    <p><strong>Faixa A:</strong> 0 a 500 pacotes - R$ 0,70</p>
                    <p><strong>Faixa B:</strong> 501 a 1.000 pacotes - R$ 0,60</p>
                    <p><strong>Faixa C:</strong> 1.001 a 5.000 pacotes - R$ 0,50</p>
                    <p><strong>Faixa D:</strong> 5.001 a 10.000 pacotes - R$ 0,40</p>
                    <p><strong>Faixa E:</strong> 10.001 a 15.000 pacotes - R$ 0,30</p>
                    <p><strong>Faixa F:</strong> Acima de 15.001 pacotes - R$ 0,20</p>
                    <p className="text-xs italic">* O cálculo é cumulativo por faixa.</p>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="number"
                        value={sellerPackages}
                        onChange={(e) => setSellerPackages(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Qtd. de pacotes"
                        className="p-2 border rounded-md w-48"
                    />
                    <button 
                        onClick={handleCalculateSeller}
                        className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                        <Calculator size={18} className="mr-2"/>
                        Calcular
                    </button>
                </div>
                {sellerResult && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-gray-700"><strong>Cálculo:</strong> {sellerResult.breakdown}</p>
                        <p className="text-lg font-bold text-primary mt-2">Total: R$ {sellerResult.total.toFixed(2)}</p>
                    </div>
                )}
            </CalculatorCard>
            
            {/* Return Packages Calculator */}
            <CalculatorCard title="Pacotes de Devolução">
                 <div className="mb-4 space-y-2 text-sm text-gray-600">
                    <p><strong>Valor Fixo:</strong> R$ 0,80 por pacote.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <input 
                        type="number"
                        value={returnPackages}
                        onChange={(e) => setReturnPackages(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Qtd. de devoluções"
                        className="p-2 border rounded-md w-48"
                    />
                    <button 
                        onClick={handleCalculateReturn}
                        className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                        <Calculator size={18} className="mr-2"/>
                        Calcular
                    </button>
                 </div>
                 {returnResult && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-gray-700"><strong>Cálculo:</strong> {returnResult.breakdown}</p>
                        <p className="text-lg font-bold text-primary mt-2">Total: R$ {returnResult.total.toFixed(2)}</p>
                    </div>
                 )}
            </CalculatorCard>

            {/* Pickup Packages Calculator */}
            <CalculatorCard title="Pacotes de Retirada (Coleta)">
                <div className="mb-4 text-sm text-gray-600">
                    <p>O cálculo por faixas (o mesmo de "Pacotes de Vendedores") é aplicado separadamente para pacotes recebidos e pacotes entregues.</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <input 
                        type="number"
                        value={pickupReceived}
                        onChange={(e) => setPickupReceived(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Qtd. recebida do vendedor"
                        className="p-2 border rounded-md w-full md:w-60"
                    />
                    <input 
                        type="number"
                        value={pickupDelivered}
                        onChange={(e) => setPickupDelivered(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Qtd. entregue ao comprador"
                        className="p-2 border rounded-md w-full md:w-60"
                    />
                    <button 
                        onClick={handleCalculatePickup}
                        className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors w-full md:w-auto">
                        <Calculator size={18} className="mr-2"/>
                        Calcular
                    </button>
                </div>
                 {pickupResult && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg space-y-3">
                        <div>
                            <p className="text-sm text-gray-700"><strong>Recebidos:</strong> {pickupResult.breakdownReceived} = <strong className="text-indigo-700">R$ {pickupResult.totalReceived.toFixed(2)}</strong></p>
                            <p className="text-sm text-gray-700"><strong>Entregues:</strong> {pickupResult.breakdownDelivered} = <strong className="text-indigo-700">R$ {pickupResult.totalDelivered.toFixed(2)}</strong></p>
                        </div>
                        <p className="text-lg font-bold text-primary mt-2">Total Geral: R$ {pickupResult.total.toFixed(2)}</p>
                    </div>
                 )}
            </CalculatorCard>
        </div>
    );
}

export default ShopeeCalc;