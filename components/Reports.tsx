
import React, { useState, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ChevronDown, Printer, Calendar as CalendarIcon, TrendingUp, DollarSign, Wallet, Package, Users, Wrench, Filter, ArrowDown, ArrowUp, AlertCircle, Clock } from 'lucide-react';
import { 
    MOCK_INVOICES,
    MOCK_ACCOUNTS_PAYABLE,
    MOCK_ACCOUNTS_RECEIVABLE,
    MOCK_PRODUCTS,
    MOCK_CUSTOMERS,
    MOCK_SERVICE_ORDERS,
    MOCK_ELECTRONICS_SERVICE_ORDERS,
    MOCK_AUTOMOTIVE_SERVICE_ORDERS,
    MOCK_SECURITY_SERVICE_ORDERS,
    MOCK_SOLAR_ENERGY_SERVICE_ORDERS,
    MOCK_IT_CONSULTING_SERVICE_ORDERS
} from '../constants';
import { type Invoice, type AccountTransaction, type Product, type ServiceOrder, type Customer, InvoiceStatus, ServiceOrderStatus } from '../types';

// Helper
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Sub-components
const ReportKpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
            {icon}
        </div>
    </div>
);

const ReportSection: React.FC<{ title: string; icon: React.ReactNode; onPrint: () => void; sectionId: string; children: React.ReactNode; }> = ({ title, icon, onPrint, sectionId, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden report-section-container" id={sectionId}>
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50 cursor-pointer no-print hover:bg-gray-50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border rounded-lg shadow-sm text-primary">{icon}</div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={(e) => { e.stopPropagation(); onPrint(); }} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1.5 bg-white border px-3 py-1.5 rounded-md transition-colors shadow-sm">
                        <Printer size={16} /> Imprimir
                    </button>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div className="p-6 report-content">
                    {children}
                </div>
            )}
        </div>
    );
};

// Main Component
const Reports: React.FC = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [activeRange, setActiveRange] = useState<string>('thisMonth');

    const setDefaultDateRange = (range: 'today' | 'last7' | 'thisMonth' | 'thisYear') => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start = new Date(today);
        let end = new Date(today);
        end.setHours(23, 59, 59, 999);

        switch (range) {
            case 'last7':
                start.setDate(today.getDate() - 6);
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'thisYear':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
        setActiveRange(range);
    };
    
    useEffect(() => {
        setDefaultDateRange('thisMonth');
    }, []);

    const allServiceOrders = useMemo(() => [
        ...MOCK_SERVICE_ORDERS, ...MOCK_ELECTRONICS_SERVICE_ORDERS, ...MOCK_AUTOMOTIVE_SERVICE_ORDERS, 
        ...MOCK_SECURITY_SERVICE_ORDERS, ...MOCK_SOLAR_ENERGY_SERVICE_ORDERS, ...MOCK_IT_CONSULTING_SERVICE_ORDERS
    ], []);

    const handleGenerateReport = () => {
        if (!startDate || !endDate) return;

        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T23:59:59Z`);

        // Filter data
        const invoices = MOCK_INVOICES.filter(i => { const d = new Date(i.issueDate); return d >= start && d <= end; });
        const serviceOrders = allServiceOrders.filter(o => { const d = new Date(o.creationDate); return d >= start && d <= end; });
        const accountsPayable = MOCK_ACCOUNTS_PAYABLE.filter(a => { const d = new Date(a.dueDate); return d >= start && d <= end; });
        const accountsReceivable = MOCK_ACCOUNTS_RECEIVABLE.filter(a => { const d = new Date(a.dueDate); return d >= start && d <= end; });

        // Sales Report
        const issuedInvoices = invoices.filter(i => i.status === InvoiceStatus.Issued);
        const totalRevenue = issuedInvoices.reduce((sum, i) => sum + i.totalInvoice, 0);
        const salesByDate = issuedInvoices.reduce((acc, inv) => {
            const date = new Date(inv.issueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            acc[date] = (acc[date] || 0) + inv.totalInvoice;
            return acc;
        }, {} as Record<string, number>);
        const salesChartData = Object.entries(salesByDate).map(([name, revenue]) => ({ name, revenue }));

        // Financial Report
        const totalReceived = MOCK_ACCOUNTS_RECEIVABLE.filter(a => a.status === 'Paid' && new Date(a.paymentDate!) >= start && new Date(a.paymentDate!) <= end).reduce((sum, a) => sum + a.amount, 0);
        const totalPaid = MOCK_ACCOUNTS_PAYABLE.filter(a => a.status === 'Paid' && new Date(a.paymentDate!) >= start && new Date(a.paymentDate!) <= end).reduce((sum, a) => sum + a.amount, 0);
        const expensesByCategory = accountsPayable.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {} as Record<string, number>);
        const expenseChartData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
        
        // Products Report
        const soldItems = issuedInvoices.flatMap(i => i.items);
        const productSales = soldItems.reduce((acc, item) => {
            acc[item.description] = (acc[item.description] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);
        const topSoldProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const lowStockProducts = MOCK_PRODUCTS.filter(p => p.stock < 10);

        // Customers Report
        const customerSpending = issuedInvoices.reduce((acc, inv) => {
            acc[inv.customer.name] = (acc[inv.customer.name] || 0) + inv.totalInvoice;
            return acc;
        }, {} as Record<string, number>);
        const topCustomers = Object.entries(customerSpending).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const newCustomerIds = new Set(issuedInvoices.map(i => i.customer.id));

        // Services Report
        const completedOS = serviceOrders.filter(o => o.status === ServiceOrderStatus.Completed);
        const revenueFromServices = completedOS.reduce((sum, o) => sum + (o.totalValue || 0), 0);
        const osStatusCounts = serviceOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<ServiceOrderStatus, number>);
        const osStatusChartData = Object.entries(osStatusCounts).map(([name, value]) => ({ name, value }));

        setReportData({
            invoices, serviceOrders, accountsPayable, accountsReceivable,
            sales: {
                totalRevenue,
                ticketMedio: issuedInvoices.length > 0 ? totalRevenue / issuedInvoices.length : 0,
                totalSales: issuedInvoices.length,
                chartData: salesChartData,
            },
            financial: {
                totalReceived,
                totalToReceive: accountsReceivable.filter(a => a.status !== 'Paid').reduce((s, a) => s + a.amount, 0),
                totalPaid,
                totalToPay: accountsPayable.filter(a => a.status !== 'Paid').reduce((s, a) => s + a.amount, 0),
                expenseChartData,
            },
            products: { topSoldProducts, lowStockProducts },
            customers: { topCustomers, newCustomersCount: newCustomerIds.size },
            services: {
                totalOS: serviceOrders.length,
                completedOS: completedOS.length,
                revenue: revenueFromServices,
                chartData: osStatusChartData,
            },
        });
    };
    
    const handlePrintSection = (sectionId: string) => {
        const printableElement = document.getElementById(sectionId)?.querySelector('.report-content');
        if (printableElement) {
            const title = document.getElementById(sectionId)?.querySelector('h3')?.innerText || "Relatório";
            const printContent = `
                <div class="p-8 font-sans">
                    <div class="text-center mb-8 border-b pb-4">
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">${title}</h1>
                        <p class="text-sm text-gray-500">Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    ${printableElement.innerHTML}
                </div>
            `;
             flushSync(() => {
                setPrintableContent(printContent);
            });
            window.print();
            setPrintableContent(null);
        }
    };
    
    useEffect(() => {
        if(startDate && endDate) {
            handleGenerateReport();
        }
    }, [startDate, endDate]);
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="text-primary" /> Relatórios Gerenciais
                    </h1>
                    <p className="text-gray-500 mt-1">Analise o desempenho do seu negócio com dados detalhados.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
                <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 p-1.5 rounded-lg">
                    {[
                        { id: 'today', label: 'Hoje' },
                        { id: 'last7', label: '7 Dias' },
                        { id: 'thisMonth', label: 'Este Mês' },
                        { id: 'thisYear', label: 'Este Ano' }
                    ].map(range => (
                        <button 
                            key={range.id}
                            onClick={() => setDefaultDateRange(range.id as any)} 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeRange === range.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                         <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                         <input type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setActiveRange('custom');}} className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <span className="text-gray-400 font-medium">até</span>
                    <div className="relative">
                         <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                         <input type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setActiveRange('custom');}} className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
            </div>

            {!reportData ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <Filter className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">Selecione um período para gerar os relatórios.</p>
                </div>
            ) : (
                <>
                <ReportSection title="Vendas e Faturamento" icon={<TrendingUp size={20}/>} onPrint={() => handlePrintSection('sales-report')} sectionId="sales-report">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <ReportKpiCard title="Faturamento Total" value={formatCurrency(reportData.sales.totalRevenue)} icon={<DollarSign size={24} className="text-green-600"/>} colorClass="bg-green-100 text-green-600" />
                        <ReportKpiCard title="Ticket Médio" value={formatCurrency(reportData.sales.ticketMedio)} icon={<Package size={24} className="text-blue-600"/>} colorClass="bg-blue-100 text-blue-600" />
                        <ReportKpiCard title="Notas Emitidas" value={reportData.sales.totalSales} icon={<Filter size={24} className="text-purple-600"/>} colorClass="bg-purple-100 text-purple-600" />
                    </div>
                     <h4 className="font-bold text-gray-700 mb-4 ml-2">Evolução de Vendas</h4>
                    <div className="h-[300px] w-full bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportData.sales.chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ReportSection>
                
                <ReportSection title="Financeiro e Fluxo de Caixa" icon={<Wallet size={20}/>} onPrint={() => handlePrintSection('financial-report')} sectionId="financial-report">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <ReportKpiCard title="Recebimentos" value={formatCurrency(reportData.financial.totalReceived)} icon={<ArrowUp size={24}/>} colorClass="bg-emerald-100 text-emerald-600" />
                        <ReportKpiCard title="Pagamentos" value={formatCurrency(reportData.financial.totalPaid)} icon={<ArrowDown size={24}/>} colorClass="bg-red-100 text-red-600" />
                        <ReportKpiCard title="A Receber" value={formatCurrency(reportData.financial.totalToReceive)} icon={<Clock size={24}/>} colorClass="bg-blue-100 text-blue-600" />
                        <ReportKpiCard title="A Pagar" value={formatCurrency(reportData.financial.totalToPay)} icon={<AlertCircle size={24}/>} colorClass="bg-orange-100 text-orange-600" />
                    </div>
                     <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-gray-700 mb-4">Despesas por Categoria</h4>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={reportData.financial.expenseChartData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius={60} 
                                            outerRadius={80} 
                                            paddingAngle={5}
                                        >
                                            {reportData.financial.expenseChartData.map((e: any, i: number) => (
                                                <Cell key={`cell-${i}`} fill={['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'][i % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                         <div className="flex flex-col justify-center bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-2">Saldo do Período</h4>
                            <p className="text-sm text-gray-500 mb-6">Diferença entre total recebido e total pago.</p>
                            <div className={`text-4xl font-bold ${reportData.financial.totalReceived - reportData.financial.totalPaid >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(reportData.financial.totalReceived - reportData.financial.totalPaid)}
                            </div>
                        </div>
                     </div>
                </ReportSection>

                <ReportSection title="Produtos e Estoque" icon={<Package size={20}/>} onPrint={() => handlePrintSection('products-report')} sectionId="products-report">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center"><TrendingUp size={18} className="mr-2 text-green-500"/> Top 5 Mais Vendidos</h4>
                            <ul className="space-y-3">
                                {reportData.products.topSoldProducts.map(([name, count]: [string, number], i: number) => (
                                    <li key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center">
                                            <span className="w-6 h-6 rounded-full bg-white border text-center text-xs font-bold leading-6 mr-3 text-gray-500">{i + 1}</span>
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{name}</span>
                                        </div>
                                        <strong className="text-primary text-sm">{count} un.</strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center"><AlertCircle size={18} className="mr-2 text-red-500"/> Alerta de Estoque Baixo</h4>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                <ul className="space-y-3">
                                    {reportData.products.lowStockProducts.map((p: Product) => (
                                        <li key={p.id} className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-100">
                                            <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">{p.stock} un.</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </ReportSection>

                <ReportSection title="Serviços e O.S." icon={<Wrench size={20}/>} onPrint={() => handlePrintSection('services-report')} sectionId="services-report">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <ReportKpiCard title="Receita de Serviços" value={formatCurrency(reportData.services.revenue)} icon={<DollarSign size={24} className="text-emerald-600"/>} colorClass="bg-emerald-100 text-emerald-600" />
                        <ReportKpiCard title="O.S. Abertas" value={reportData.services.totalOS} icon={<Wrench size={24} className="text-indigo-600"/>} colorClass="bg-indigo-100 text-indigo-600" />
                        <ReportKpiCard title="Concluídas" value={reportData.services.completedOS} icon={<Users size={24} className="text-blue-600"/>} colorClass="bg-blue-100 text-blue-600" />
                    </div>
                     <h4 className="font-bold text-gray-700 mb-4">Status das Ordens de Serviço</h4>
                     <div className="h-[300px] w-full bg-gray-50 rounded-xl border border-gray-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={reportData.services.chartData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={80} 
                                    outerRadius={110} 
                                    paddingAngle={2}
                                    label
                                >
                                    {reportData.services.chartData.map((e: any, i: number) => (
                                        <Cell key={`cell-${i}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#d97706', '#ef4444'][i % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ marginRight: '20px' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ReportSection>

                <ReportSection title="Clientes" icon={<Users size={20}/>} onPrint={() => handlePrintSection('customers-report')} sectionId="customers-report">
                     <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                             <h4 className="font-bold text-gray-800 mb-4">Top 5 Clientes (Valor)</h4>
                             <ul className="divide-y divide-gray-100">
                                {reportData.customers.topCustomers.map(([name, value]: [string, number], i: number) => (
                                    <li key={name} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mr-3">{i + 1}</div>
                                            <span className="text-sm font-medium text-gray-700">{name}</span>
                                        </div>
                                        <strong className="text-gray-800">{formatCurrency(value)}</strong>
                                    </li>
                                ))}
                             </ul>
                        </div>
                        <div className="text-center p-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-80"/>
                            <h4 className="text-xl font-medium mb-2">Novos Clientes</h4>
                            <p className="text-sm opacity-80 mb-6">Clientes que realizaram a primeira compra neste período.</p>
                            <p className="text-7xl font-extrabold tracking-tight">{reportData.customers.newCustomersCount}</p>
                        </div>
                    </div>
                </ReportSection>
                </>
            )}
            
            <div id="reports-dynamic-print-area" className="hidden" dangerouslySetInnerHTML={{ __html: printableContent || '' }} />
        </div>
    );
};

export default Reports;
