
import React from 'react';
import { DollarSign, Receipt, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SALES_DATA, CATEGORY_DATA, MOCK_INVOICES } from '../constants';
import { InvoiceStatus } from '../types';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);


const Dashboard: React.FC = () => {
  const totalRevenue = MOCK_INVOICES
    .filter(inv => inv.status === InvoiceStatus.Issued)
    // FIX: Property 'total' does not exist on type 'Invoice'. Changed to 'totalInvoice'.
    .reduce((acc, inv) => acc + inv.totalInvoice, 0);

  const pendingInvoices = MOCK_INVOICES.filter(inv => inv.status === InvoiceStatus.Pending).length;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-white" />} color="bg-green-500" />
        <KpiCard title="Notas Emitidas (Mês)" value="35" icon={<Receipt className="text-white" />} color="bg-blue-500" />
        <KpiCard title="Novos Clientes (Mês)" value="12" icon={<Users className="text-white" />} color="bg-indigo-500" />
        <KpiCard title="Notas Pendentes" value={`${pendingInvoices}`} icon={<AlertTriangle className="text-white" />} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Visão Geral de Faturamento</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={SALES_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#4f46e5" name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Vendas por Categoria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                {CATEGORY_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `${value} unidades`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;