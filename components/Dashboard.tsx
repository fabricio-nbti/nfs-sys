
import React, { useMemo } from 'react';
import { 
  DollarSign, CheckCircle, Clock, PieChart as PieChartIcon, 
  UserPlus, FileWarning, PackageSearch, Activity, FileText, 
  Wrench, ArrowUpCircle, Plus, ShoppingCart, Users, ArrowRight, 
  TrendingUp, AlertTriangle, Calendar, ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend as RechartsLegend, 
  AreaChart, Area 
} from 'recharts';
import { 
    MOCK_INVOICES,
    MOCK_SERVICE_ORDERS,
    MOCK_ELECTRONICS_SERVICE_ORDERS,
    MOCK_AUTOMOTIVE_SERVICE_ORDERS,
    MOCK_SECURITY_SERVICE_ORDERS,
    MOCK_SOLAR_ENERGY_SERVICE_ORDERS,
    MOCK_IT_CONSULTING_SERVICE_ORDERS,
    MOCK_ACCOUNTS_RECEIVABLE,
    MOCK_PRODUCTS
} from '../constants';
import { InvoiceStatus, type AppSettings, type ServiceOrder, ServiceOrderStatus } from '../types';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5">
        <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-indigo-600">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass: string; trend?: string; trendUp?: boolean }> = ({ title, value, icon, colorClass, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md group relative overflow-hidden">
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-800 group-hover:text-primary transition-colors">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600 shadow-sm`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="flex items-center text-xs font-medium relative z-10">
        <span className={`flex items-center px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trendUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1 rotate-180" />} 
          {trend}
        </span>
        <span className="text-gray-400 ml-2">vs. mês anterior</span>
      </div>
    )}
    {/* Decoration */}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 ${colorClass.replace('bg-', 'bg-')}`}></div>
  </div>
);

const QuickAction: React.FC<{ title: string; icon: React.ReactNode; color: string; onClick?: () => void }> = ({ title, icon, color, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all group w-full relative overflow-hidden">
        <div className={`p-3 rounded-full mb-3 ${color} text-white group-hover:scale-110 transition-transform shadow-md`}>
            {icon}
        </div>
        <span className="text-sm font-bold text-gray-700 group-hover:text-primary">{title}</span>
    </button>
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
    // 1. Gather all visible Service Orders
    const visibleServiceOrders: ServiceOrder[] = [];
    if (settings.showMobileRepair) visibleServiceOrders.push(...MOCK_SERVICE_ORDERS);
    if (settings.showElectronicsRepair) visibleServiceOrders.push(...MOCK_ELECTRONICS_SERVICE_ORDERS);
    if (settings.showAutomotiveRepair) visibleServiceOrders.push(...MOCK_AUTOMOTIVE_SERVICE_ORDERS);
    if (settings.showSecuritySystems) visibleServiceOrders.push(...MOCK_SECURITY_SERVICE_ORDERS);
    if (settings.showSolarEnergy) visibleServiceOrders.push(...MOCK_SOLAR_ENERGY_SERVICE_ORDERS);
    if (settings.showITConsulting) visibleServiceOrders.push(...MOCK_IT_CONSULTING_SERVICE_ORDERS);

    // 2. Calculate Total Revenue (Invoices + Completed OS if not invoiced logic - simplified to just Issued Invoices for Revenue)
    // For better dashboard, let's assume Total Revenue comes from Issued Invoices.
    const issuedInvoices = MOCK_INVOICES.filter(inv => inv.status === InvoiceStatus.Issued);
    const newTotalRevenue = issuedInvoices.reduce((acc, inv) => acc + inv.totalInvoice, 0);
    
    // 3. Ticket Average
    const newTicketMedio = issuedInvoices.length > 0 ? newTotalRevenue / issuedInvoices.length : 0;
    
    // 4. New Customers (Mock logic: counts unique customers in invoices of current month)
    // Assuming current month is July 2024 based on mock data
    const currentMonthPrefix = '2024-07';
    const newNovosClientesMes = new Set(issuedInvoices
        .filter(inv => inv.issueDate.startsWith(currentMonthPrefix))
        .map(inv => inv.customer.id)
    ).size;

    // 5. Financial Alerts
    const newContasVencidasValor = MOCK_ACCOUNTS_RECEIVABLE
        .filter(acc => acc.status === 'Overdue')
        .reduce((sum, acc) => sum + acc.amount, 0);

    const newBaixoEstoqueCount = MOCK_PRODUCTS.filter(p => p.stock <= 5).length;

    // 6. OS Stats
    const newCompletedOrdersCount = visibleServiceOrders.filter(o => o.status === ServiceOrderStatus.Completed).length;
    const newPendingOrdersCount = visibleServiceOrders.filter(o => [ServiceOrderStatus.InProgress, ServiceOrderStatus.Pending, ServiceOrderStatus.WaitingParts].includes(o.status)).length;
    
    // 7. Monthly Revenue Data (Chart)
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyDataMap = new Map<string, number>();
    
    // Seed all months with 0
    monthNames.forEach(m => monthlyDataMap.set(m, 0));

    // Populate from Invoices
    issuedInvoices.forEach(inv => {
        const date = new Date(inv.issueDate);
        const monthName = monthNames[date.getUTCMonth()];
        monthlyDataMap.set(monthName, (monthlyDataMap.get(monthName) || 0) + inv.totalInvoice);
    });

    // Mocking previous months for better chart visualization since mock data is mostly current month
    monthlyDataMap.set('Jan', 15000);
    monthlyDataMap.set('Fev', 18500);
    monthlyDataMap.set('Mar', 22000);
    monthlyDataMap.set('Abr', 19800);
    monthlyDataMap.set('Mai', 25600);
    monthlyDataMap.set('Jun', 28900);
    // July uses actual data + some base
    monthlyDataMap.set('Jul', (monthlyDataMap.get('Jul') || 0) + 32000); 

    const monthlyData = Array.from(monthlyDataMap).map(([name, revenue]) => ({ name, revenue }));

    // 8. OS Status Distribution (Chart)
    const statusCounts = visibleServiceOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<ServiceOrderStatus, number>);
    const newOsStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 9. Recent Activities Feed
    const serviceOrderActivities = visibleServiceOrders.map(os => ({
        type: 'OS',
        id: os.id,
        date: new Date(os.creationDate),
        title: `O.S. ${os.status}`,
        description: `${os.deviceType} - ${os.customerName}`,
        amount: os.totalValue,
        status: os.status
    }));
    const invoiceActivities = MOCK_INVOICES.map(inv => ({
        type: 'Invoice',
        id: inv.id,
        date: new Date(inv.issueDate),
        title: `Nota Fiscal Emitida`,
        description: `Cliente: ${inv.customer.name}`,
        amount: inv.totalInvoice,
        status: inv.status
    }));
    
    const newAtividadesRecentes = [...serviceOrderActivities, ...invoiceActivities]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 6);
        
    // 10. Upcoming Receivables
    const newContasAReceber = MOCK_ACCOUNTS_RECEIVABLE
      .filter(acc => acc.status === 'Pending' || acc.status === 'Overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    return {
        totalRevenue: newTotalRevenue + 161800, // Adding mock base for realism
        completedOrdersCount: newCompletedOrdersCount,
        pendingOrdersCount: newPendingOrdersCount,
        monthlyRevenueData: monthlyData,
        ticketMedio: newTicketMedio,
        novosClientesMes: newNovosClientesMes + 12, // Mock boost
        contasVencidasValor: newContasVencidasValor,
        baixoEstoqueCount: newBaixoEstoqueCount,
        osStatusDistribution: newOsStatusDistribution,
        atividadesRecentes: newAtividadesRecentes,
        contasAReceber: newContasAReceber,
    };
  }, [settings]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
  const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
    [ServiceOrderStatus.Completed]: '#10b981', // Emerald
    [ServiceOrderStatus.InProgress]: '#f59e0b', // Amber
    [ServiceOrderStatus.Pending]: '#3b82f6', // Blue
    [ServiceOrderStatus.WaitingParts]: '#d97706', // Orange
    [ServiceOrderStatus.Canceled]: '#ef4444', // Red
  };

  return (
    <div className="space-y-8">
      
      {/* Quick Actions Section */}
      <section>
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Acesso Rápido</h2>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             <QuickAction title="PDV (Frente de Caixa)" icon={<ShoppingCart size={24}/>} color="bg-blue-600" />
             <QuickAction title="Emitir Nota Fiscal" icon={<FileText size={24}/>} color="bg-indigo-600" />
             <QuickAction title="Nova Ordem Serviço" icon={<Wrench size={24}/>} color="bg-orange-500" />
             <QuickAction title="Cadastrar Cliente" icon={<UserPlus size={24}/>} color="bg-emerald-500" />
             <div className="hidden lg:block">
                <QuickAction title="Entrada Estoque" icon={<PackageSearch size={24}/>} color="bg-purple-500" />
             </div>
         </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
            title="Faturamento (Mês)" 
            value={formatCurrency(totalRevenue / 12)} // Showing approx monthly
            icon={<DollarSign size={24}/>} 
            colorClass="bg-green-100 text-green-600"
            trend="+12%"
            trendUp={true}
        />
        <KpiCard 
            title="O.S. Em Andamento" 
            value={pendingOrdersCount.toString()} 
            icon={<Clock size={24}/>} 
            colorClass="bg-blue-100 text-blue-600"
        />
        <KpiCard 
            title="Contas Vencidas" 
            value={formatCurrency(contasVencidasValor)} 
            icon={<FileWarning size={24}/>} 
            colorClass="bg-red-100 text-red-600"
            trend="+5%"
            trendUp={false} // Bad trend
        />
        <KpiCard 
            title="Estoque Crítico" 
            value={`${baixoEstoqueCount} itens`} 
            icon={<AlertTriangle size={24}/>} 
            colorClass="bg-amber-100 text-amber-600"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Monthly Revenue Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Faturamento Mensal</h3>
                        <p className="text-xs text-gray-400">Visão geral da receita bruta acumulada</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button className="px-3 py-1 text-xs font-medium bg-white rounded shadow-sm text-gray-800">Anual</button>
                        <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">Semestral</button>
                    </div>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} 
                                tickFormatter={(value) => `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#6366f1" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#6366f1' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* OS Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Status das O.S.</h3>
                    <div className="h-64 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={osStatusDistribution} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60}
                                    outerRadius={80} 
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {osStatusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as ServiceOrderStatus] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#374151', fontSize: '12px', fontWeight: 600 }}
                                />
                                <RechartsLegend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Metrics List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                     <h3 className="text-lg font-bold text-gray-800 mb-6">Indicadores Chave</h3>
                     <div className="space-y-6">
                         <div>
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-gray-600 font-medium">Ticket Médio</span>
                                 <span className="font-bold text-gray-800">{formatCurrency(ticketMedio)}</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                 <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-gray-600 font-medium">Novos Clientes</span>
                                 <div className="flex items-center text-emerald-600 font-bold">
                                    <ArrowUpCircle size={14} className="mr-1"/>
                                    <span>{novosClientesMes}</span>
                                 </div>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                 <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-gray-600 font-medium">Taxa de Conclusão O.S.</span>
                                 <span className="font-bold text-gray-800">85%</span>
                             </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                 <div className="bg-blue-500 h-full rounded-full" style={{ width: '85%' }}></div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
        
        {/* Right Column (Activities & Finance) */}
        <div className="space-y-8">
             {/* Recent Activity Feed */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Atividades Recentes</h3>
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                  {atividadesRecentes.map((activity, index) => (
                    <div key={`${activity.type}-${activity.id}-${index}`} className="mb-0 ml-6 relative">
                        <div className={`absolute -left-[31px] top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${activity.type === 'OS' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            {activity.type === 'OS' ? <Wrench size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-gray-800">{activity.title}</p>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{activity.date.toLocaleDateString('pt-BR')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.description}</p>
                            <div className="mt-1 flex items-center gap-2">
                                {activity.amount && (
                                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {formatCurrency(activity.amount)}
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{activity.status}</span>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center">
                    Ver todas atividades <ArrowRight size={14} className="ml-1"/>
                </button>
            </div>
            
            {/* Accounts Receivable List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Próximos Recebimentos</h3>
                    <span className="p-1.5 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={16} /></span>
                </div>
                <div className="space-y-3">
                  {contasAReceber.length > 0 ? contasAReceber.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-1 h-8 rounded-full ${acc.status === 'Overdue' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">{acc.description}</p>
                                <div className="flex items-center text-xs text-gray-500">
                                    <Calendar size={10} className="mr-1"/>
                                    {new Date(acc.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </div>
                            </div>
                        </div>
                        <span className={`text-sm font-bold whitespace-nowrap ${acc.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                            {formatCurrency(acc.amount)}
                        </span>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-sm">Nenhum recebimento pendente.</p>
                    </div>
                  )}
                </div>
                 <button className="w-full mt-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 py-2">
                    Gerenciar Financeiro <ExternalLink size={12} className="ml-1"/>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
