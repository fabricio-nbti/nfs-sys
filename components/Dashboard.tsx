
import React, { useMemo } from 'react';
import { DollarSign, CheckCircle, Clock, PieChart as PieChartIcon, UserPlus, FileWarning, PackageSearch, Activity, FileText, Wrench, ArrowUpCircle, Plus, ShoppingCart, Users, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as RechartsLegend, AreaChart, Area } from 'recharts';
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

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass: string; trend?: string }> = ({ title, value, icon, colorClass, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-primary transition-colors">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="flex items-center text-xs">
        <span className="text-green-500 font-medium flex items-center bg-green-50 px-2 py-0.5 rounded-full">
          <ArrowUpCircle size={12} className="mr-1" /> {trend}
        </span>
        <span className="text-gray-400 ml-2">vs mês anterior</span>
      </div>
    )}
  </div>
);

const QuickAction: React.FC<{ title: string; icon: React.ReactNode; color: string; onClick?: () => void }> = ({ title, icon, color, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all group w-full">
        <div className={`p-3 rounded-full mb-2 ${color} text-white group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-primary">{title}</span>
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
        description: `Nova O.S. #${os.id}`,
        detail: `Cliente: ${os.customerName}`
    }));
    const invoiceActivities = MOCK_INVOICES.map(inv => ({
        type: 'Invoice',
        date: new Date(inv.issueDate),
        description: `${inv.type} #${inv.id} emitida`,
        detail: `Valor: ${formatCurrency(inv.totalInvoice)}`
    }));
    const newAtividadesRecentes = [...serviceOrderActivities, ...invoiceActivities]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 6);
        
    // 6. Dados de Contas a Receber
    const newContasAReceber = MOCK_ACCOUNTS_RECEIVABLE
      .filter(acc => acc.status === 'Pending' || acc.status === 'Overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

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
      case 'OS': return <div className="bg-yellow-100 p-2 rounded-full"><Wrench className="w-4 h-4 text-yellow-600" /></div>;
      case 'Invoice': return <div className="bg-green-100 p-2 rounded-full"><FileText className="w-4 h-4 text-green-600" /></div>;
      default: return <div className="bg-gray-100 p-2 rounded-full"><Activity className="w-4 h-4 text-gray-600" /></div>;
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Quick Actions Section */}
      <section>
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Acesso Rápido</h2>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             <QuickAction title="Nova Venda (PDV)" icon={<ShoppingCart size={20}/>} color="bg-blue-600" />
             <QuickAction title="Emitir Nota Fiscal" icon={<FileText size={20}/>} color="bg-indigo-600" />
             <QuickAction title="Nova O.S." icon={<Wrench size={20}/>} color="bg-orange-500" />
             <QuickAction title="Novo Cliente" icon={<UserPlus size={20}/>} color="bg-emerald-500" />
             <div className="hidden lg:block">
                <QuickAction title="Adicionar Produto" icon={<PackageSearch size={20}/>} color="bg-purple-500" />
             </div>
         </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
            title="Faturamento (Mês)" 
            value={formatCurrency(totalRevenue)} 
            icon={<DollarSign size={24} className="text-green-600"/>} 
            colorClass="bg-green-100" 
            trend="+12%"
        />
        <KpiCard 
            title="O.S. Pendentes" 
            value={pendingOrdersCount.toString()} 
            icon={<Clock size={24} className="text-yellow-600"/>} 
            colorClass="bg-yellow-100"
        />
        <KpiCard 
            title="Contas Vencidas" 
            value={formatCurrency(contasVencidasValor)} 
            icon={<FileWarning size={24} className="text-red-600"/>} 
            colorClass="bg-red-100"
        />
        <KpiCard 
            title="Baixo Estoque" 
            value={baixoEstoqueCount.toString()} 
            icon={<PackageSearch size={24} className="text-purple-600"/>} 
            colorClass="bg-purple-100"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Faturamento Mensal</h3>
                    <select className="text-sm border-gray-200 rounded-md text-gray-500 bg-gray-50 p-1">
                        <option>Últimos 12 meses</option>
                        <option>Este Ano</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyRevenueData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `R$${(value as number / 1000)}k`}/>
                        <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Status das O.S.</h3>
                    <div className="h-64">
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
                                >
                                    {osStatusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as ServiceOrderStatus] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <RechartsLegend iconType="circle" iconSize={8} wrapperStyle={{fontSize: '12px'}} layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                     <h3 className="text-lg font-bold text-gray-800 mb-4">Métricas Rápidas</h3>
                     <div className="space-y-6">
                         <div>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-gray-600">Ticket Médio</span>
                                 <span className="font-bold text-gray-800">{formatCurrency(ticketMedio)}</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2">
                                 <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-gray-600">Novos Clientes</span>
                                 <span className="font-bold text-gray-800">{novosClientesMes}</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2">
                                 <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-gray-600">O.S. Concluídas</span>
                                 <span className="font-bold text-gray-800">{completedOrdersCount}</span>
                             </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                 <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
        
        {/* Right Column (Activities & Finance) */}
        <div className="space-y-8">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Atividades Recentes</h3>
                <div className="relative border-l border-gray-200 ml-3 space-y-6">
                  {atividadesRecentes.map((activity, index) => (
                    <div key={index} className="mb-0 ml-6 relative">
                        <div className="absolute -left-[37px] top-0 bg-white">
                            <ActivityIcon type={activity.type} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>
                            <span className="text-[10px] text-gray-400 block mt-1">{activity.date.toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-2 text-sm text-primary font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                    Ver todas atividades
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Próximos Recebimentos</h3>
                    <ArrowUpCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-3">
                  {contasAReceber.length > 0 ? contasAReceber.map((acc) => (
                    <div key={acc.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className={`w-1 h-10 rounded-full mr-3 ${acc.status === 'Overdue' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{acc.description}</p>
                            <p className="text-xs text-gray-500">{new Date(acc.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>
                        <span className={`text-sm font-bold ${acc.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                            {formatCurrency(acc.amount)}
                        </span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum recebimento pendente.</p>
                  )}
                </div>
                 <button className="w-full mt-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700">
                    Ver financeiro completo <ArrowRight size={14} className="ml-1"/>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
