
import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_COMPANIES } from '../constants';
import { type Product, type Company, type ReceiptData } from '../types';
import { PlusCircle, MinusCircle, XCircle, Search, CreditCard, Landmark, QrCode, Printer, X } from 'lucide-react';
import ReceiptView from './shared/ReceiptView';

interface CartItem extends Product {
  quantity: number;
}

type PaymentMethod = 'Crédito' | 'Débito' | 'Pix';

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

const PDV: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [installments, setInstallments] = useState<number | null>(null);


  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setCart(prevCart => {
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
      ).filter(item => item.quantity > 0);
    });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxes = subtotal * 0.09; // Simulação de imposto
  const total = subtotal + taxes;

  const handlePaymentMethodSelect = (name: PaymentMethod) => {
      setSelectedPaymentMethod(name);
      setInstallments(null); // Reseta as parcelas ao trocar de método
  };

  const finalizeSale = () => {
    if (cart.length === 0) {
      alert("Adicione produtos ao carrinho para finalizar a venda.");
      return;
    }
    if (!selectedPaymentMethod) {
        alert("Por favor, selecione uma forma de pagamento.");
        return;
    }
     if (selectedPaymentMethod === 'Crédito' && !installments) {
        alert("Por favor, selecione o número de parcelas.");
        return;
    }
    
    const newReceiptData: ReceiptData = {
      id: `TX-${Date.now()}`,
      date: new Date().toLocaleString('pt-BR'),
      company: MOCK_COMPANIES[0], // Pega a primeira empresa como vendedora
      items: cart.map(item => ({
        quantity: item.quantity,
        name: item.name,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      subtotal: subtotal,
      taxes: taxes,
      total: total,
      paymentMethod: selectedPaymentMethod,
      installments: selectedPaymentMethod === 'Crédito' ? installments || undefined : undefined,
    };

    setReceiptData(newReceiptData);
    setIsReceiptModalOpen(true);
  };
  
  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setReceiptData(null);
    setCart([]); // Limpa o carrinho após fechar o modal
    setSelectedPaymentMethod(null); // Limpa a forma de pagamento
    setInstallments(null);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const paymentMethods: {name: PaymentMethod, icon: React.ReactNode}[] = [
      { name: 'Crédito', icon: <CreditCard/> },
      { name: 'Débito', icon: <Landmark/> },
      { name: 'Pix', icon: <QrCode/> },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 p-4">
      {/* Product Grid */}
      <div className="lg:w-3/5 bg-white p-6 rounded-lg shadow-md flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Produtos</h2>
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Buscar produto..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
                <div key={product.id} className="border p-4 rounded-lg text-center cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => addToCart(product)}>
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-gray-600">{formatCurrency(product.price)}</p>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="lg:w-2/5 bg-white p-6 rounded-lg shadow-md flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Resumo do Pedido</h2>
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-8">O carrinho está vazio.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-4 pb-2 border-b">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-primary hover:text-red-500"><MinusCircle size={20}/></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-primary hover:text-green-500"><PlusCircle size={20}/></button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-2 text-gray-400 hover:text-red-700"><XCircle size={20}/></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-auto pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Impostos</span>
            <span>{formatCurrency(taxes)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl mb-4">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="mb-4">
              <h3 className="font-semibold text-center mb-2">Forma de Pagamento</h3>
              <div className="flex justify-center gap-4">
                {paymentMethods.map(({ name, icon }) => (
                     <button 
                        key={name}
                        onClick={() => handlePaymentMethodSelect(name)}
                        className={`flex flex-col items-center p-2 border rounded-lg w-24 transition-colors ${
                            selectedPaymentMethod === name 
                            ? 'bg-primary text-white border-primary' 
                            : 'hover:bg-gray-100'
                        }`}
                     >
                        {icon}
                        <span>{name}</span>
                    </button>
                ))}
              </div>
              {selectedPaymentMethod === 'Crédito' && (
                <div className="mt-4">
                    <label htmlFor="installments" className="block text-sm font-medium text-gray-700 text-center mb-1">Parcelas</label>
                    <select
                        id="installments"
                        value={installments || ''}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="" disabled>Selecione...</option>
                        {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                                {num === 1 ? 'À vista' : `${num}x`}
                            </option>
                        ))}
                    </select>
                </div>
              )}
          </div>
          <button 
            onClick={finalizeSale}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            disabled={cart.length === 0 || !selectedPaymentMethod || (selectedPaymentMethod === 'Crédito' && !installments)}
            >
            Finalizar Venda e Emitir Cupom
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
       {isReceiptModalOpen && receiptData && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-sm flex flex-col">
             <div className="p-4 overflow-y-auto">
                <ReceiptView receipt={receiptData} />
             </div>
             <div className="flex justify-between items-center p-4 border-t bg-white rounded-b-lg no-print">
               <button onClick={handleCloseReceiptModal} className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2">
                    <X size={18} />
                    Fechar
               </button>
               <button onClick={handlePrint} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
                   <Printer size={18} className="mr-2" />
                   Imprimir Cupom
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default PDV;
