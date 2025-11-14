
import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { type Product } from '../types';
import { PlusCircle, MinusCircle, XCircle, Search, CreditCard, Landmark, QrCode } from 'lucide-react';

interface CartItem extends Product {
  quantity: number;
}

const PDV: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const finalizeSale = () => {
    if (cart.length === 0) {
      alert("Adicione produtos ao carrinho para finalizar a venda.");
      return;
    }
    // Lógica de finalização de venda
    // Aqui ocorreria a chamada para um backend para emitir a NFCe/NFe via nfe-sped
    alert(`Venda finalizada! Total: R$ ${total.toFixed(2)}. Uma NFCe seria emitida agora.`);
    setCart([]);
  };

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
                <p className="text-gray-600">R$ {product.price.toFixed(2)}</p>
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
                  <p className="text-sm text-gray-500">R$ {item.price.toFixed(2)}</p>
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
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Impostos</span>
            <span>R$ {taxes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl mb-4">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="mb-4">
              <h3 className="font-semibold text-center mb-2">Forma de Pagamento</h3>
              <div className="flex justify-center gap-4">
                  <button className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-100"><CreditCard/><span>Crédito</span></button>
                  <button className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-100"><Landmark/><span>Débito</span></button>
                  <button className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-100"><QrCode/><span>Pix</span></button>
              </div>
          </div>
          <button 
            onClick={finalizeSale}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            disabled={cart.length === 0}
            >
            Finalizar Venda e Emitir NFCe
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDV;
