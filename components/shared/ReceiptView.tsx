import React from 'react';
import { type ReceiptData } from '../../types';

interface ReceiptViewProps {
  receipt: ReceiptData;
}

const ReceiptView: React.FC<ReceiptViewProps> = ({ receipt }) => {
  
  const line = '-'.repeat(42);

  const getPaymentMethodDisplay = () => {
    if (receipt.paymentMethod === 'Crédito' && receipt.installments) {
        return `${receipt.paymentMethod} - ${receipt.installments > 1 ? `${receipt.installments}x` : 'À vista'}`;
    }
    return receipt.paymentMethod;
  }

  return (
    <div id="receipt-print-area" className="p-2 bg-white font-mono text-black text-xs max-w-sm mx-auto">
      <div className="text-center">
        <h1 className="text-sm font-bold">{receipt.company.name}</h1>
        <p>{receipt.company.legalName}</p>
        <p>{receipt.company.address}</p>
        <p>CNPJ: {receipt.company.document}</p>
      </div>

      <p className="my-1">{line}</p>
      
      <div>
        <p>Data: {receipt.date}</p>
        <p>Transação: {receipt.id}</p>
      </div>

      <p className="my-1">{line}</p>

      <div className="text-center my-2">
          <h2 className="font-bold">CUPOM NÃO FISCAL</h2>
      </div>

      <p className="my-1">{line}</p>
      
      {/* Items Header */}
      <div className="flex justify-between font-bold">
        <span className="w-1/12">QTD</span>
        <span className="w-6/12 text-left">DESCRIÇÃO</span>
        <span className="w-2/12 text-right">VL.UN</span>
        <span className="w-3/12 text-right">VL.TOTAL</span>
      </div>

      {/* Items List */}
      <div className="my-1">
        {receipt.items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span className="w-1/12">{item.quantity}</span>
            <span className="w-6/12 text-left truncate">{item.name}</span>
            <span className="w-2/12 text-right">{item.unitPrice.toFixed(2)}</span>
            <span className="w-3/12 text-right font-semibold">{item.totalPrice.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <p className="my-1">{line}</p>

      {/* Totals & Payment Method */}
      <div className="space-y-1 mt-1">
        {receipt.paymentMethod && (
          <div className="flex justify-between font-semibold mb-2">
              <span>Forma de Pagamento</span>
              <span>{getPaymentMethodDisplay()}</span>
          </div>
        )}
        <div className="border-t pt-1 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {receipt.subtotal.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
              <span>Impostos (simul.)</span>
              <span>R$ {receipt.taxes.toFixed(2)}</span>
            </div>
             <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>R$ {receipt.total.toFixed(2)}</span>
            </div>
        </div>
      </div>

      <p className="my-1">{line}</p>

      {/* Footer */}
      <div className="text-center text-[10px] leading-tight space-y-2 mt-2">
        <p><strong>Garantia:</strong> 90 dias contra defeitos de fabricação.</p>
        <p><strong>Troca:</strong> Em até 7 dias úteis com a embalagem original e cupom.</p>
        <p className="font-bold mt-2">Agradecemos a sua preferência!</p>
      </div>
    </div>
  );
};

export default ReceiptView;