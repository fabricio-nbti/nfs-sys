
import React, { useMemo } from 'react';
import { type ServiceOrder, type Company } from '../../types';

interface ServiceOrderReceiptViewProps {
  order: ServiceOrder;
  company: Company;
}

const formatCurrency = (value: number | null | undefined): string => {
  const numberValue = Number(value);
  if (value === null || typeof value === 'undefined' || isNaN(numberValue)) {
    return 'A definir';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};

const ServiceOrderReceiptView: React.FC<ServiceOrderReceiptViewProps> = ({ order, company }) => {

  const line = '-'.repeat(42);
  
  const qrCodeUrl = useMemo(() => {
    if (order?.publicLink) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(order.publicLink)}`;
    }
    return '';
  }, [order]);

  return (
    <div id="service-order-receipt-print-area" className="p-2 bg-white font-mono text-black text-xs max-w-sm mx-auto">
      <div className="text-center">
        <h1 className="text-sm font-bold">{company.name}</h1>
        <p>{company.address}</p>
        <p>CNPJ: {company.document}</p>
      </div>

      <p className="my-1">{line}</p>
      
      <div className="text-center my-2">
          <h2 className="font-bold">COMPROVANTE DE ENTRADA</h2>
      </div>

      <p><strong>O.S. Nº:</strong> {order.id}</p>
      <p><strong>Data Entrada:</strong> {new Date(order.creationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
      {order.estimatedDeliveryDate && (
         <p><strong>Previsão Entrega:</strong> {new Date(order.estimatedDeliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
      )}

      <p className="my-1">{line}</p>
      
      <p className="font-bold mb-1">DADOS DO CLIENTE:</p>
      <p>{order.customerName}</p>
      <p>{order.customerPhone}</p>

      <p className="my-1">{line}</p>

      <p className="font-bold mb-1">DADOS DO EQUIPAMENTO:</p>
      <p><strong>Tipo:</strong> {order.deviceType}</p>
      <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
      {order.vehiclePlate && <p><strong>Placa:</strong> {order.vehiclePlate}</p>}
      {order.imeiOrSerial && <p><strong>Série/IMEI:</strong> {order.imeiOrSerial}</p>}
      {order.accessories && <p><strong>Acessórios:</strong> {order.accessories}</p>}
      
      <p className="my-1">{line}</p>
      
      <p className="font-bold mb-1">PROBLEMA RELATADO:</p>
      <p>{order.reportedProblem}</p>

      <p className="my-1">{line}</p>
       
      <p className="font-bold mb-1">VALORES (SUJEITO A ALTERAÇÃO):</p>
      <p><strong>Serviço:</strong> {formatCurrency(order.serviceCost)}</p>
      <p><strong>Peças:</strong> {formatCurrency(order.partsCost)}</p>
      <p><strong>Total:</strong> {formatCurrency(order.totalValue)}</p>
      
      <p className="my-1">{line}</p>

      <div className="text-center text-[10px] leading-tight space-y-2 mt-2">
        <p className="font-bold">Acompanhe o status pelo QR Code:</p>
        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code de Acompanhamento" className="mx-auto my-2"/>}
        <p>A garantia deste serviço é de 90 dias e cobre apenas o reparo realizado.</p>
        <p>Equipamentos não retirados em até 90 dias após a conclusão do serviço serão considerados abandonados.</p>
        <div className="pt-8">
            <p>___________________________________</p>
            <p>Assinatura do Cliente</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceOrderReceiptView;
