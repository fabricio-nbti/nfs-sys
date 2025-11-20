
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MOCK_PRODUCTS, MOCK_COMPANIES, MOCK_CATEGORIES } from '../constants';
import { type Product, type Company, type ReceiptData } from '../types';
import { PlusCircle, MinusCircle, XCircle, Search, CreditCard, Landmark, QrCode, Printer, X, DollarSign, Image as ImageIcon, ShoppingBag, Trash2 } from 'lucide-react';
import ReceiptView from './shared/ReceiptView';

interface CartItem extends Product {
  quantity: number;
}

type PaymentMethod = 'Crédito' | 'Débito' | 'Pix' | 'Dinheiro';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [installments, setInstallments] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [change, setChange] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  // Filter Products
  const filteredProducts = useMemo(() => {
      return MOCK_PRODUCTS.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
          return matchesSearch && matchesCategory;
      });
  }, [searchTerm, selectedCategory]);

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

  const handlePaymentMethodSelect = (name: PaymentMethod) => {
      setSelectedPaymentMethod(name);
      setInstallments(null);
      setAmountReceived('');
      setChange(0);
  };

  const handleAmountReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        setAmountReceived('');
        setChange(0);
        return;
    }
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
        setAmountReceived(numericValue);
        if (numericValue >= total) {
            setChange(numericValue - total);
        } else {
            setChange(0);
        }
    }
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
    if (selectedPaymentMethod === 'Dinheiro' && (amountReceived === '' || Number(amountReceived) < total)) {
        alert("O valor recebido deve ser maior ou igual ao total da venda.");
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
      total: total,
      paymentMethod: selectedPaymentMethod,
      installments: selectedPaymentMethod === 'Crédito' ? installments || undefined : undefined,
      amountReceived: selectedPaymentMethod === 'Dinheiro' ? Number(amountReceived) : undefined,
      change: selectedPaymentMethod === 'Dinheiro' ? change : undefined,
    };

    setReceiptData(newReceiptData);
    setIsReceiptModalOpen(true);
  };
  
  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setReceiptData(null);
    setCart([]);
    setSelectedPaymentMethod(null);
    setInstallments(null);
    setAmountReceived('');
    setChange(0);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        switch(e.key) {
            case 'F1':
                e.preventDefault();
                searchInputRef.current?.focus();
                break;
            case 'F2':
                e.preventDefault();
                const canFinalize = cart.length > 0 && selectedPaymentMethod &&
                    (selectedPaymentMethod !== 'Crédito' || installments) &&
                    (selectedPaymentMethod !== 'Dinheiro' || (amountReceived !== '' && Number(amountReceived) >= total));
                if (canFinalize) {
                    finalizeSale();
                }
                break;
            case 'F3': e.preventDefault(); handlePaymentMethodSelect('Dinheiro'); break;
            case 'F4': e.preventDefault(); handlePaymentMethodSelect('Crédito'); break;
            case 'F5': e.preventDefault(); handlePaymentMethodSelect('Débito'); break;
            case 'F6': e.preventDefault(); handlePaymentMethodSelect('Pix'); break;
            case 'Escape':
                if (isReceiptModalOpen) {
                    e.preventDefault();
                    handleCloseReceiptModal();
                }
                break;
            default: break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedPaymentMethod, installments, amountReceived, total, isReceiptModalOpen]);
  
  const paymentMethods: {name: PaymentMethod, icon: React.ReactNode, shortcut: string}[] = [
      { name: 'Dinheiro', icon: <DollarSign size={24}/>, shortcut: 'F3' },
      { name: 'Crédito', icon: <CreditCard size={24}/>, shortcut: 'F4' },
      { name: 'Débito', icon: <Landmark size={24}/>, shortcut: 'F5' },
      { name: 'Pix', icon: <QrCode size={24}/>, shortcut: 'F6' },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 p-2 -mt-4">
      
      {/* LEFT: Product Catalog */}
      <div className="lg:w-3/5 flex flex-col h-full">
        
        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Buscar por nome, código ou SKU... (F1)"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Categories Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                    onClick={() => setSelectedCategory('Todos')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'Todos' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todos
                </button>
                {MOCK_CATEGORIES.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredProducts.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Search size={48} className="mb-4 opacity-20"/>
                    <p className="text-lg">Nenhum produto encontrado.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group flex flex-col" 
                        onClick={() => addToCart(product)}
                    >
                        <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                            ) : (
                                <ImageIcon className="text-gray-300 w-12 h-12" />
                            )}
                             {product.stock <= 5 && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                    Pouco Estoque
                                </span>
                             )}
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                            <h3 className="font-semibold text-gray-700 text-sm line-clamp-2 mb-1">{product.name}</h3>
                            <p className="text-xs text-gray-400 mb-2">{product.sku}</p>
                            <div className="mt-auto flex justify-between items-center">
                                <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <PlusCircle size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="lg:w-2/5 flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag size={20} />
                Carrinho de Compras
            </h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} itens
            </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <ShoppingBag size={64} className="mb-4 opacity-20"/>
                <p>Seu carrinho está vazio.</p>
                <p className="text-sm">Adicione produtos para começar a venda.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                <div className="flex-1 pr-4">
                  <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)} un.</p>
                </div>
                
                <div className="flex items-center gap-3 mr-4">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"><MinusCircle size={20}/></button>
                  <span className="font-bold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-green-500 hover:bg-green-50 p-1 rounded"><PlusCircle size={20}/></button>
                </div>

                <div className="text-right min-w-[80px]">
                    <p className="font-bold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 hover:text-red-600 mt-1 flex items-center justify-end w-full gap-1">
                        <Trash2 size={12} /> Remover
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Area */}
        <div className="bg-gray-50 p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             {/* Totals */}
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-800 text-lg">Total a Pagar</span>
                    <span className="font-extrabold text-3xl text-primary">{formatCurrency(total)}</span>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-4">
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map(({ name, icon, shortcut }) => (
                     <button 
                        key={name}
                        onClick={() => handlePaymentMethodSelect(name)}
                        className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${
                            selectedPaymentMethod === name 
                            ? 'bg-gray-800 text-white border-gray-800 shadow-md transform scale-105' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                     >
                        {icon}
                        <span className="mt-1 text-[10px] font-semibold uppercase">{name}</span>
                        <span className="text-[9px] opacity-60">{shortcut}</span>
                    </button>
                ))}
              </div>

               {/* Conditional Inputs */}
              {selectedPaymentMethod === 'Crédito' && (
                <div className="mt-3 animate-fade-in">
                    <select
                        value={installments || ''}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    >
                        <option value="" disabled>Selecione o parcelamento...</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                                {num === 1 ? 'À vista' : `${num}x de ${formatCurrency(total / num)}`}
                            </option>
                        ))}
                    </select>
                </div>
              )}
               {selectedPaymentMethod === 'Dinheiro' && (
                <div className="mt-3 animate-fade-in flex gap-3 items-center">
                    <div className="flex-1">
                         <label className="block text-xs font-semibold text-gray-500 mb-1">Valor Recebido</label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={amountReceived}
                                onChange={handleAmountReceivedChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-lg font-bold"
                                placeholder="0,00"
                                autoFocus
                            />
                         </div>
                    </div>
                    {change > 0 && (
                        <div className="bg-green-100 px-4 py-2 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 font-semibold uppercase">Troco</p>
                            <p className="text-lg font-bold text-green-700">{formatCurrency(change)}</p>
                        </div>
                    )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <button 
                onClick={finalizeSale}
                disabled={cart.length === 0}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2"
            >
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-normal">F2</span>
                Finalizar Venda
            </button>
        </div>
      </div>

      {/* Receipt Modal */}
       {isReceiptModalOpen && receiptData && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
             <div className="p-6 overflow-y-auto bg-gray-50 max-h-[70vh]">
                <ReceiptView receipt={receiptData} />
             </div>
             <div className="flex justify-between items-center p-4 border-t bg-white no-print">
               <button onClick={handleCloseReceiptModal} className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={18} />
                    Fechar (Esc)
               </button>
               <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors font-bold shadow-md">
                   <Printer size={18} className="mr-2" />
                   Imprimir
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default PDV;
