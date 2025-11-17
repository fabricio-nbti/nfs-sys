import React, { useState, useMemo, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, Printer, Calendar as CalendarIcon, TrendingUp, DollarSign, Wallet, Package, Users, Wrench } from 'lucide-react';
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
const ReportKpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center border">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
);

const ReportSection: React.FC<{ title: string; icon: React.ReactNode; onPrint: () => void; sectionId: string; children: React.ReactNode; }> = ({ title, icon, onPrint, sectionId, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
        <div className="bg-white rounded-lg shadow-md mb-6 report-section-container" id={sectionId}>
            <div className="flex justify-between items-center p-4 border-b cursor-pointer no-print" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center">
                    <div className="text-primary mr-3">{icon}</div>
                    <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={(e) => { e.stopPropagation(); onPrint(); }} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1">
                        <Printer size={16} /> Imprimir
                    </button>
                    <ChevronDown size={24} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
    };
    
    useEffect(() => {
        setDefaultDateRange('thisMonth');
    }, []);

    const allServiceOrders = useMemo(() => [
        ...MOCK_SERVICE_ORDERS, ...MOCK_ELECTRONICS_SERVICE_ORDERS, ...MOCK_AUTOMOTIVE_SERVICE_ORDERS, 
        ...MOCK_SECURITY_SERVICE_ORDERS, ...MOCK_SOLAR_ENERGY_SERVICE_ORDERS, ...MOCK_IT_CONSULTING_SERVICE_ORDERS
    ], []);

    const handleGenerateReport = () => {
        if (!startDate || !endDate) {
            alert("Por favor, selecione um período de datas.");
            return;
        }

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
            const date = new Date(inv.issueDate).toLocaleDateString('pt-BR');
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
                <div class="p-4">
                    <h1 class="text-2xl font-bold mb-4 text-center">${title}</h1>
                    <p class="text-center text-sm mb-4">Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}</p>
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
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 no-print">Central de Relatórios</h1>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md" />
                    <span className="text-gray-500">até</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setDefaultDateRange('today')} className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Hoje</button>
                    <button onClick={() => setDefaultDateRange('last7')} className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Últimos 7 dias</button>
                    <button onClick={() => setDefaultDateRange('thisMonth')} className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Este Mês</button>
                    <button onClick={() => setDefaultDateRange('thisYear')} className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">Este Ano</button>
                </div>
            </div>

            {!reportData ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <p>Selecione um período e gere o relatório para visualizar os dados.</p>
                </div>
            ) : (
                <>
                <ReportSection title="Relatório de Vendas" icon={<TrendingUp />} onPrint={() => handlePrintSection('sales-report')} sectionId="sales-report">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <ReportKpiCard title="Faturamento Total" value={formatCurrency(reportData.sales.totalRevenue)} />
                        <ReportKpiCard title="Ticket Médio" value={formatCurrency(reportData.sales.ticketMedio)} />
                        <ReportKpiCard title="Total de Vendas" value={reportData.sales.totalSales} />
                    </div>
                     <h4 className="font-semibold mb-2">Vendas no Período</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={reportData.sales.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v: number) => formatCurrency(v)} /><Bar dataKey="revenue" fill="#4f46e5" name="Faturamento" /></BarChart>
                    </ResponsiveContainer>
                </ReportSection>
                
                <ReportSection title="Relatório Financeiro" icon={<Wallet />} onPrint={() => handlePrintSection('financial-report')} sectionId="financial-report">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <ReportKpiCard title="Total Recebido" value={formatCurrency(reportData.financial.totalReceived)} />
                        <ReportKpiCard title="A Receber" value={formatCurrency(reportData.financial.totalToReceive)} />
                        <ReportKpiCard title="Total Pago" value={formatCurrency(reportData.financial.totalPaid)} />
                        <ReportKpiCard title="A Pagar" value={formatCurrency(reportData.financial.totalToPay)} />
                    </div>
                     <h4 className="font-semibold mb-2">Despesas por Categoria</h4>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart><Pie data={reportData.financial.expenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{reportData.financial.expenseChartData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={['#ef4444', '#f97316', '#eab308', '#84cc16'][i % 4]} />)}</Pie><Tooltip formatter={(v: number) => formatCurrency(v)} /><Legend /></PieChart>
                     </ResponsiveContainer>
                </ReportSection>

                <ReportSection title="Relatório de Produtos" icon={<Package />} onPrint={() => handlePrintSection('products-report')} sectionId="products-report">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold mb-2">Top 5 Produtos Mais Vendidos</h4>
                            <ul className="space-y-2">{reportData.products.topSoldProducts.map(([name, count]: [string, number]) => <li key={name} className="flex justify-between p-2 bg-gray-50 rounded-md"><span>{name}</span> <strong>{count} un.</strong></li>)}</ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">Produtos com Baixo Estoque (&lt;10)</h4>
                            <ul className="space-y-2">{reportData.products.lowStockProducts.map((p: Product) => <li key={p.id} className="flex justify-between p-2 bg-red-50 rounded-md"><span>{p.name}</span> <strong className="text-red-600">{p.stock} un.</strong></li>)}</ul>
                        </div>
                    </div>
                </ReportSection>

                <ReportSection title="Relatório de Clientes" icon={<Users />} onPrint={() => handlePrintSection('customers-report')} sectionId="customers-report">
                     <div className="grid md:grid-cols-2 gap-8">
                        <div>
                             <h4 className="font-semibold mb-2">Top 5 Clientes (por valor)</h4>
                            <ul className="space-y-2">{reportData.customers.topCustomers.map(([name, value]: [string, number]) => <li key={name} className="flex justify-between p-2 bg-gray-50 rounded-md"><span>{name}</span> <strong>{formatCurrency(value)}</strong></li>)}</ul>
                        </div>
                        <div className="text-center">
                            <h4 className="font-semibold mb-2">Novos Clientes no Período</h4>
                            <p className="text-6xl font-bold text-primary">{reportData.customers.newCustomersCount}</p>
                        </div>
                    </div>
                </ReportSection>

                <ReportSection title="Relatório de Serviços" icon={<Wrench />} onPrint={() => handlePrintSection('services-report')} sectionId="services-report">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <ReportKpiCard title="Faturamento com Serviços" value={formatCurrency(reportData.services.revenue)} />
                        <ReportKpiCard title="Total de O.S. Abertas" value={reportData.services.totalOS} />
                        <ReportKpiCard title="O.S. Concluídas" value={reportData.services.completedOS} />
                    </div>
                     <h4 className="font-semibold mb-2">Ordens de Serviço por Status</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart><Pie data={reportData.services.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{reportData.services.chartData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#d97706', '#ef4444'][i % 5]} />)}</Pie><Tooltip /><Legend /></PieChart>
                    </ResponsiveContainer>
                </ReportSection>
                </>
            )}
            
            <div id="reports-dynamic-print-area" className="hidden" dangerouslySetInnerHTML={{ __html: printableContent || '' }} />
        </div>
    );
};

export default Reports;
