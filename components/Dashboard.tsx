
import React, { useMemo } from 'react';
import { DollarSign, CheckCircle, Clock, PieChart as PieChartIcon, UserPlus, FileWarning, PackageSearch, Activity, FileText, Wrench, ArrowUpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as RechartsLegend } from 'recharts';
import { 
    MOCK_INVOICES,
    MOCK_SERVICE_ORDERS,
    MOCK_ELECTRONICS_SERVICE_ORDERS,
    MOCK_AUTOMOTIVE_SERVICE_ORDERS,
    MOCK_SECURITY_SERVICE_ORDERS,
    MOCK_SOLAR_ENERGY_SERVICE_ORDERS,
    MOCK_IT_CONSULTING_SERVICE_ORDERS,
    MOCK_CUSTOMERS,
    MOCK_ACCOUNTS_RECEIVABLE,
    MOCK_PRODUCTS
} from '../constants';
import { InvoiceStatus, type AppSettings, type ServiceOrder, ServiceOrderStatus, AccountTransaction } from '../types';

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
    monthlyRevenueData,
    ticketMedio,
    novosClientesMes,
    contasVencidasValor,
    baixoEstoqueCount,
    osStatusDistribution,
    atividadesRecentes,
    contasAReceber,
  } = useMemo(() => {
    // 1. Agrupar todas as Ordens de Serviço visíveis
    const visibleServiceOrders: ServiceOrder[] = [];
    if (settings.showMobileRepair) visibleServiceOrders.push(...MOCK_SERVICE_ORDERS);
    if (settings.showElectronicsRepair) visibleServiceOrders.push(...MOCK_ELECTRONICS_SERVICE_ORDERS);
    if (settings.showAutomotiveRepair) visibleServiceOrders.push(...MOCK_AUTOMOTIVE_SERVICE_ORDERS);
    if (settings.showSecuritySystems) visibleServiceOrders.push(...MOCK_SECURITY_SERVICE_ORDERS);
    if (settings.showSolarEnergy) visibleServiceOrders.push(...MOCK_SOLAR_ENERGY_SERVICE_ORDERS);
    if (settings.showITConsulting) visibleServiceOrders.push(...MOCK_IT_CONSULTING_SERVICE_ORDERS);

    // 2. Filtrar Faturas com base nas O.S. visíveis
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
        return true; // Faturas não relacionadas a O.S. são sempre visíveis
    });

    // 3. Cálculos para os KPIs
    const issuedInvoices = visibleInvoices.filter(inv => inv.status === InvoiceStatus.Issued);
    const newTotalRevenue = issuedInvoices.reduce((acc, inv) => acc + inv.totalInvoice, 0);
    const newTicketMedio = issuedInvoices.length > 0 ? newTotalRevenue / issuedInvoices.length : 0;
    
    // Simulação de "este mês" (usando Julho/2024 dos dados mock)
    const newNovosClientesMes = new Set(issuedInvoices
        .filter(inv => inv.issueDate.startsWith('2024-07'))
        .map(inv => inv.customer.id)
    ).size;

    const newContasVencidasValor = MOCK_ACCOUNTS_RECEIVABLE
        .filter(acc => acc.status === 'Overdue')
        .reduce((sum, acc) => sum + acc.amount, 0);

    const newBaixoEstoqueCount = MOCK_PRODUCTS.filter(p => p.stock <= 10).length;

    const newCompletedOrdersCount = visibleServiceOrders.filter(o => o.status === ServiceOrderStatus.Completed).length;
    const newPendingOrdersCount = visibleServiceOrders.filter(o => [ServiceOrderStatus.InProgress, ServiceOrderStatus.Pending, ServiceOrderStatus.WaitingParts].includes(o.status)).length;
    
    // 4. Dados para os Gráficos
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = monthNames.map(name => ({ name, revenue: 0 }));
    issuedInvoices.forEach(inv => {
        const monthIndex = new Date(inv.issueDate).getUTCMonth();
        monthlyData[monthIndex].revenue += inv.totalInvoice;
    });

    const statusCounts = visibleServiceOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<ServiceOrderStatus, number>);
    const newOsStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 5. Feed de Atividades Recentes
    const serviceOrderActivities = visibleServiceOrders.map(os => ({
        type: 'OS',
        date: new Date(os.creationDate),
        description: `Nova O.S. #${os.id} para ${os.customerName}`
    }));
    const invoiceActivities = MOCK_INVOICES.map(inv => ({
        type: 'Invoice',
        date: new Date(inv.issueDate),
        description: `${inv.type} #${inv.id} emitida para ${inv.customer.name}`
    }));
    const newAtividadesRecentes = [...serviceOrderActivities, ...invoiceActivities]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);
        
    // 6. Dados de Contas a Receber
    const newContasAReceber = MOCK_ACCOUNTS_RECEIVABLE
      .filter(acc => acc.status === 'Pending' || acc.status === 'Overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5); // Pega os 5 mais próximos/vencidos


    return {
        totalRevenue: newTotalRevenue,
        completedOrdersCount: newCompletedOrdersCount,
        pendingOrdersCount: newPendingOrdersCount,
        monthlyRevenueData: monthlyData.filter(m => m.revenue > 0),
        ticketMedio: newTicketMedio,
        novosClientesMes: newNovosClientesMes,
        contasVencidasValor: newContasVencidasValor,
        baixoEstoqueCount: newBaixoEstoqueCount,
        osStatusDistribution: newOsStatusDistribution,
        atividadesRecentes: newAtividadesRecentes,
        contasAReceber: newContasAReceber,
    };
  }, [settings]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
  const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
    [ServiceOrderStatus.Completed]: '#10b981',
    [ServiceOrderStatus.InProgress]: '#f59e0b',
    [ServiceOrderStatus.Pending]: '#3b82f6',
    [ServiceOrderStatus.WaitingParts]: '#d97706',
    [ServiceOrderStatus.Canceled]: '#ef4444',
  };


  const ActivityIcon: React.FC<{type: string}> = ({ type }) => {
    switch(type) {
      case 'OS': return <Wrench className="w-5 h-5 text-yellow-500" />;
      case 'Invoice': return <FileText className="w-5 h-5 text-green-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };


  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Geral</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Faturamento do Mês" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="text-white" />} color="bg-green-500" />
        <KpiCard title="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<PieChartIcon className="text-white" />} color="bg-indigo-500" />
        <KpiCard title="Novos Clientes (Mês)" value={`${novosClientesMes}`} icon={<UserPlus className="text-white" />} color="bg-blue-500" />
        <KpiCard title="Contas Vencidas" value={`R$ ${contasVencidasValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<FileWarning className="text-white" />} color="bg-red-500" />
        <KpiCard title="O.S. Concluídas" value={`${completedOrdersCount}`} icon={<CheckCircle className="text-white" />} color="bg-teal-500" />
        <KpiCard title="O.S. Pendentes" value={`${pendingOrdersCount}`} icon={<Clock className="text-white" />} color="bg-yellow-500" />
        <KpiCard title="Baixo Estoque (<10)" value={`${baixoEstoqueCount} produtos`} icon={<PackageSearch className="text-white" />} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Faturamento Mensal (Módulos Ativos)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$${(value as number / 1000)}k`}/>
              <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#4f46e5" name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Status das O.S.</h2>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                    <Pie 
                        data={osStatusDistribution} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={50}
                        outerRadius={80} 
                        fill="#8884d8" 
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                    >
                        {osStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as ServiceOrderStatus] || COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} O.S.`, name]} />
                    <RechartsLegend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Atividades Recentes</h2>
                <ul className="space-y-4">
                  {atividadesRecentes.map((activity, index) => (
                    <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <ActivityIcon type={activity.type} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-500">{activity.date.toLocaleDateString('pt-BR')}</p>
                        </div>
                    </li>
                  ))}
                </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <ArrowUpCircle className="w-6 h-6 text-green-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-700">Próximos Recebimentos</h2>
                </div>
                <ul className="space-y-4">
                  {contasAReceber.length > 0 ? contasAReceber.map((acc) => (
                    <li key={acc.id} className="flex items-center">
                        <div className={`flex-shrink-0 h-3 w-3 rounded-full mr-3 ${
                            acc.status === 'Overdue' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} title={acc.status === 'Overdue' ? 'Vencido' : 'Pendente'}></div>
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-800 font-medium">{acc.description}</p>
                                <p className="text-xs text-gray-500">Vence em: {new Date(acc.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                            </div>
                            <span className={`text-sm font-bold ${acc.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                                R$ {acc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </li>
                  )) : (
                    <p className="text-sm text-gray-500 text-center">Nenhum recebimento pendente.</p>
                  )}
                </ul>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
