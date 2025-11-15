import React, { useMemo } from 'react';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
    CATEGORY_DATA, 
    MOCK_INVOICES,
    MOCK_SERVICE_ORDERS,
    MOCK_ELECTRONICS_SERVICE_ORDERS,
    MOCK_AUTOMOTIVE_SERVICE_ORDERS,
    MOCK_SECURITY_SERVICE_ORDERS,
    MOCK_SOLAR_ENERGY_SERVICE_ORDERS,
    MOCK_IT_CONSULTING_SERVICE_ORDERS
} from '../constants';
import { InvoiceStatus, type AppSettings, type ServiceOrder, ServiceOrderStatus, type Invoice } from '../types';

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

interface DashboardProps {
  settings: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ settings }) => {
  const { 
    totalRevenue, 
    completedOrdersCount, 
    pendingOrdersCount,
    monthlyRevenueData 
  } = useMemo(() => {
    const visibleServiceOrders: ServiceOrder[] = [];
    if (settings.showMobileRepair) visibleServiceOrders.push(...MOCK_SERVICE_ORDERS);
    if (settings.showElectronicsRepair) visibleServiceOrders.push(...MOCK_ELECTRONICS_SERVICE_ORDERS);
    if (settings.showAutomotiveRepair) visibleServiceOrders.push(...MOCK_AUTOMOTIVE_SERVICE_ORDERS);
    if (settings.showSecuritySystems) visibleServiceOrders.push(...MOCK_SECURITY_SERVICE_ORDERS);
    if (settings.showSolarEnergy) visibleServiceOrders.push(...MOCK_SOLAR_ENERGY_SERVICE_ORDERS);
    if (settings.showITConsulting) visibleServiceOrders.push(...MOCK_IT_CONSULTING_SERVICE_ORDERS);

    const newCompletedOrdersCount = visibleServiceOrders.filter(o => o.status === ServiceOrderStatus.Completed).length;
    const newPendingOrdersCount = visibleServiceOrders.filter(o => [ServiceOrderStatus.InProgress, ServiceOrderStatus.Pending, ServiceOrderStatus.WaitingParts].includes(o.status)).length;
    
    const getModuleFromOsId = (osId: string): keyof AppSettings | null => {
        if (osId.startsWith('OS-')) return 'showMobileRepair';
        if (osId.startsWith('OSE-')) return 'showElectronicsRepair';
        if (osId.startsWith('OSA-')) return 'showAutomotiveRepair';
        if (osId.startsWith('OSS-')) return 'showSecuritySystems';
        if (osId.startsWith('OSSOL-')) return 'showSolarEnergy';
        if (osId.startsWith('OSTI-')) return 'showITConsulting';
        return null;
    }

    const visibleInvoices = MOCK_INVOICES.filter(invoice => {
        const osIdMatch = invoice.items[0]?.description.match(/OS ([A-Z-0-9]+)/);
        if (osIdMatch && osIdMatch[1]) {
            const moduleKey = getModuleFromOsId(osIdMatch[1]);
            return moduleKey ? settings[moduleKey] : true;
        }
        // Assume non-OS invoices (PDV, manual) are always visible unless a specific setting is added for them
        return true;
    });
    
    const newTotalRevenue = visibleInvoices
        .filter(inv => inv.status === InvoiceStatus.Issued)
        .reduce((acc, inv) => acc + inv.totalInvoice, 0);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = monthNames.map(name => ({ name, revenue: 0 }));
    
    visibleInvoices.forEach(inv => {
        if (inv.status === InvoiceStatus.Issued) {
            const monthIndex = new Date(inv.issueDate).getMonth();
            monthlyData[monthIndex].revenue += inv.totalInvoice;
        }
    });
    
    return {
        totalRevenue: newTotalRevenue,
        completedOrdersCount: newCompletedOrdersCount,
        pendingOrdersCount: newPendingOrdersCount,
        monthlyRevenueData: monthlyData.filter(m => m.revenue > 0)
    };
  }, [settings]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Faturamento (Módulos Ativos)" value={`R$ ${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-white" />} color="bg-green-500" />
        <KpiCard title="O.S. Concluídas" value={`${completedOrdersCount}`} icon={<CheckCircle className="text-white" />} color="bg-blue-500" />
        <KpiCard title="O.S. Pendentes" value={`${pendingOrdersCount}`} icon={<Clock className="text-white" />} color="bg-yellow-500" />
        <KpiCard title="Vendas por Categoria" value="PDV" icon={<PieChart className="text-white" />} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Faturamento Mensal (Módulos Ativos)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenueData}>
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Vendas de Produtos por Categoria</h2>
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