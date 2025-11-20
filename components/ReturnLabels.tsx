
import React, { useState, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Trash2, Save, Tag, TrendingUp, DollarSign, Calendar, PackagePlus, ArrowRight, Box, FileDown, Printer, AlertTriangle, Truck, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type ReturnEntry, type LabelStockEntry } from '../types';
import { DataTable } from './shared/DataTable';
import { MOCK_RETURN_ENTRIES, MOCK_LABEL_STOCK_ENTRIES } from '../constants';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 3 }).format(value);

const ReturnLabels: React.FC = () => {
  // State for Stock (Inputs)
  const [stockEntries, setStockEntries] = useState<LabelStockEntry[]>(MOCK_LABEL_STOCK_ENTRIES);
  const [newStockDate, setNewStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStockQuantity, setNewStockQuantity] = useState<number | ''>('');
  const [newStockTotalCost, setNewStockTotalCost] = useState<number | ''>('');
  const [newStockDesc, setNewStockDesc] = useState('');
  const [stockSelection, setStockSelection] = useState<string[]>([]);

  // State for Returns (Outputs)
  const [returnEntries, setReturnEntries] = useState<ReturnEntry[]>(MOCK_RETURN_ENTRIES);
  const [newReturnDate, setNewReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReturnQuantity, setNewReturnQuantity] = useState<number | ''>('');
  const [returnSelection, setReturnSelection] = useState<string[]>([]);

  // State for Purchase Workflow
  const [isPurchasePending, setIsPurchasePending] = useState(false);

  // State for Printing
  const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);

  // --- CALCULATIONS ---

  // 1. Weighted Average Cost Calculation
  const { totalStockQty, totalStockCost, weightedAverageCost } = useMemo(() => {
    const totalQty = stockEntries.reduce((acc, item) => acc + item.quantity, 0);
    const totalCost = stockEntries.reduce((acc, item) => acc + item.totalCost, 0);
    
    return {
        totalStockQty: totalQty,
        totalStockCost: totalCost,
        weightedAverageCost: totalQty > 0 ? totalCost / totalQty : 0
    };
  }, [stockEntries]);

  // 2. Current Stock Level
  const currentStockLevel = useMemo(() => {
      const totalUsed = returnEntries.reduce((acc, item) => acc + item.quantity, 0);
      return totalStockQty - totalUsed;
  }, [totalStockQty, returnEntries]);

  // 3. Inventory Value
  const currentInventoryValue = currentStockLevel * weightedAverageCost;

  // 4. Low Stock Warning Logic
  const { isLowStock, stockDurationDays, averageDailyUsage } = useMemo(() => {
      // Calculate average daily usage based on the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentEntries = returnEntries.filter(e => new Date(e.date) >= thirtyDaysAgo);
      const totalRecentUsage = recentEntries.reduce((acc, curr) => acc + curr.quantity, 0);
      
      // Average per day (using 30 days as denominator for stability, or 1 if 0 to avoid division issues)
      const avgUsage = totalRecentUsage / 30;
      
      const LEAD_TIME_DAYS = 10; // Tempo para chegar novas etiquetas
      const SAFETY_MARGIN_DAYS = 2; // Margem de segurança
      const WARNING_THRESHOLD_DAYS = LEAD_TIME_DAYS + SAFETY_MARGIN_DAYS; // Avisar 12 dias antes

      const stockDuration = avgUsage > 0 ? currentStockLevel / avgUsage : 999;
      const lowStock = avgUsage > 0 && stockDuration <= WARNING_THRESHOLD_DAYS;

      return {
          isLowStock: lowStock,
          stockDurationDays: stockDuration,
          averageDailyUsage: avgUsage
      };
  }, [currentStockLevel, returnEntries]);


  // --- HANDLERS ---

  // Stock Handlers
  const handleAddStock = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStockQuantity || Number(newStockQuantity) <= 0 || !newStockTotalCost || Number(newStockTotalCost) < 0) {
          alert("Por favor, informe uma quantidade e custo válidos.");
          return;
      }

      const qty = Number(newStockQuantity);
      const cost = Number(newStockTotalCost);
      
      const newEntry: LabelStockEntry = {
          id: `stock-${Date.now()}`,
          date: newStockDate,
          quantity: qty,
          totalCost: cost,
          unitCost: cost / qty,
          description: newStockDesc || 'Entrada Manual'
      };

      setStockEntries(prev => [newEntry, ...prev]);
      setNewStockQuantity('');
      setNewStockTotalCost('');
      setNewStockDesc('');
      
      // Reset purchase warning if new stock arrives
      if (isPurchasePending) {
          setIsPurchasePending(false);
          alert("Estoque atualizado! O aviso de compra pendente foi removido.");
      }
  };

  const handleDeleteStock = (id: string) => {
      if(window.confirm("Excluir esta entrada afetará o cálculo do custo médio. Continuar?")) {
        setStockEntries(prev => prev.filter(e => e.id !== id));
      }
  };

  // Return Handlers
  const handleAddReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturnQuantity || Number(newReturnQuantity) <= 0) return;

    const newEntry: ReturnEntry = {
      id: `ret-${Date.now()}`,
      date: newReturnDate,
      quantity: Number(newReturnQuantity),
    };
    setReturnEntries(prev => [newEntry, ...prev]);
    setNewReturnQuantity('');
  };

  const handleDeleteReturn = (id: string) => {
    setReturnEntries(prev => prev.filter(e => e.id !== id));
  };

  // Purchase Confirmation Handler
  const handleConfirmPurchase = () => {
      setIsPurchasePending(true);
  };

  // --- EXPORT & PRINT HANDLERS ---

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStockCSV = () => {
    const data = stockEntries.map(item => ({
      Data: item.date,
      Descricao: item.description || '',
      Quantidade: item.quantity,
      CustoTotal: item.totalCost.toFixed(2),
      CustoUnitario: item.unitCost.toFixed(4)
    }));
    exportToCSV(data, 'historico_entradas_etiquetas', ['Data', 'Descricao', 'Quantidade', 'Custo Total', 'Custo Unitario']);
  };

  const handleExportReturnCSV = () => {
    const data = returnEntries.map(item => ({
      Data: item.date,
      Quantidade: item.quantity,
      CustoMedioRef: weightedAverageCost.toFixed(4),
      CustoTotal: (item.quantity * weightedAverageCost).toFixed(2)
    }));
    exportToCSV(data, 'historico_uso_etiquetas', ['Data', 'Quantidade', 'Custo Medio Ref', 'Custo Total Estimado']);
  };

  const handlePrintTable = (title: string, columns: any[], data: any[]) => {
    const content = (
      <div className="p-8 font-sans">
        <h1 className="text-2xl font-bold mb-2 text-center">{title}</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Gerado em {new Date().toLocaleString('pt-BR')}</p>
        
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="border border-gray-300 p-2 text-left">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item: any, i: number) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} className="border border-gray-300 p-2">
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {title.includes('Entradas') && (
           <div className="mt-4 text-right">
               <p><strong>Total Quantidade:</strong> {totalStockQty}</p>
               <p><strong>Custo Total Acumulado:</strong> {formatCurrency(totalStockCost)}</p>
           </div>
        )}
        {title.includes('Saídas') && (
             <div className="mt-4 text-right">
               <p><strong>Total Utilizado:</strong> {returnEntries.reduce((acc, i) => acc + i.quantity, 0)}</p>
               <p><strong>Custo Total Estimado:</strong> {formatCurrency(returnEntries.reduce((acc, i) => acc + (i.quantity * weightedAverageCost), 0))}</p>
           </div>
        )}
      </div>
    );

    flushSync(() => {
      setPrintableContent(content);
    });
    window.print();
    setPrintableContent(null);
  };


  // --- COLUMNS ---

  const stockColumns = [
      { header: 'Data', accessor: (item: LabelStockEntry) => new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR') },
      { header: 'Descrição', accessor: 'description' as keyof LabelStockEntry },
      { header: 'Qtd.', accessor: 'quantity' as keyof LabelStockEntry },
      { header: 'Custo Total', accessor: (item: LabelStockEntry) => formatCurrency(item.totalCost) },
      { header: 'Custo Unit.', accessor: (item: LabelStockEntry) => formatCurrency(item.unitCost) },
  ];

  const returnColumns = [
    { header: 'Data', accessor: (item: ReturnEntry) => new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR') },
    { header: 'Qtd. Saída', accessor: 'quantity' as keyof ReturnEntry },
    { header: 'Custo Médio (Ref)', accessor: () => formatCurrency(weightedAverageCost) }, 
    { header: 'Custo Total', accessor: (item: ReturnEntry) => formatCurrency(item.quantity * weightedAverageCost) },
  ];
  
  // Chart Data
   const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      data[formattedDate] = 0;
      
      // Sum quantity for this date
      returnEntries.forEach(e => {
          if(e.date === dateStr) {
              data[formattedDate] += e.quantity;
          }
      });
    }
    return Object.entries(data).map(([name, quantity]) => ({ name, quantity }));
  }, [returnEntries]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Controle de Etiquetas (Entradas e Saídas)</h1>
      </div>

      {/* ALERTS SECTION */}
      <div className="no-print mb-8">
        {isLowStock && !isPurchasePending && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-800">ALERTA: Comprar Etiquetas Urgente!</h2>
                        <p className="text-red-700 mt-1">
                            Estoque atual para apenas <strong>{Math.floor(stockDurationDays)} dias</strong> (Média: {Math.floor(averageDailyUsage)}/dia). 
                            O tempo de reposição é de 10 dias.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleConfirmPurchase}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md whitespace-nowrap flex items-center"
                >
                    <Truck className="mr-2" size={20}/>
                    Já realizei o pedido
                </button>
            </div>
        )}

        {isLowStock && isPurchasePending && (
             <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg shadow-sm flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                    <Truck className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-yellow-800">Pedido em Trânsito</h2>
                    <p className="text-yellow-700 mt-1">
                        O estoque está baixo, mas a compra já foi sinalizada. Aguardando chegada das novas etiquetas.
                        <span className="block text-xs mt-1 text-gray-500">* Registre a entrada assim que as etiquetas chegarem para atualizar o estoque.</span>
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* KPIs Top Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Estoque Atual</p>
                  <p className={`text-3xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>{currentStockLevel} un</p>
                  {averageDailyUsage > 0 && (
                      <p className="text-xs text-gray-400 mt-1">~{Math.floor(stockDurationDays)} dias de duração</p>
                  )}
              </div>
              <Box className="text-blue-500 w-10 h-10" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Custo Médio Unit.</p>
                  <p className="text-3xl font-bold text-gray-800">{formatCurrency(weightedAverageCost)}</p>
              </div>
              <Tag className="text-green-500 w-10 h-10" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Valor em Estoque</p>
                  <p className="text-3xl font-bold text-gray-800">{formatCurrency(currentInventoryValue)}</p>
              </div>
              <DollarSign className="text-indigo-500 w-10 h-10" />
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 no-print">
          
          {/* Left Column: Stock INPUT */}
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-green-700 mb-4 flex items-center"><PackagePlus size={20} className="mr-2"/> Registrar Entrada (Compra)</h2>
                <form onSubmit={handleAddStock} className="space-y-4 bg-green-50 p-4 rounded-md border border-green-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase">Data</label>
                            <input type="date" value={newStockDate} onChange={e => setNewStockDate(e.target.value)} className="w-full p-2 border rounded mt-1" required/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase">Descrição</label>
                            <input type="text" value={newStockDesc} onChange={e => setNewStockDesc(e.target.value)} placeholder="Ex: Lote 500un" className="w-full p-2 border rounded mt-1" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase">Quantidade</label>
                            <input type="number" value={newStockQuantity} onChange={e => setNewStockQuantity(Number(e.target.value))} className="w-full p-2 border rounded mt-1" placeholder="1000" min="1" required/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase">Custo Total (R$)</label>
                            <input type="number" value={newStockTotalCost} onChange={e => setNewStockTotalCost(Number(e.target.value))} className="w-full p-2 border rounded mt-1" placeholder="35.00" step="0.01" min="0" required/>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-semibold">Adicionar ao Estoque</button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">Histórico de Compras</h3>
                      <div className="flex gap-2">
                        <button onClick={handleExportStockCSV} className="text-gray-600 hover:text-green-700" title="Exportar CSV">
                            <FileDown size={18} />
                        </button>
                         <button onClick={() => handlePrintTable('Relatório de Entradas de Etiquetas', stockColumns as any, stockEntries)} className="text-gray-600 hover:text-blue-700" title="Imprimir / PDF">
                            <Printer size={18} />
                        </button>
                      </div>
                  </div>
                  <DataTable<LabelStockEntry>
                    columns={stockColumns}
                    data={stockEntries}
                    selection={stockSelection}
                    onSelectionChange={setStockSelection}
                    renderActions={(item) => (
                         <button onClick={() => handleDeleteStock(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    )}
                  />
              </div>
          </div>

          {/* Right Column: Returns OUTPUT */}
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-red-700 mb-4 flex items-center"><ArrowRight size={20} className="mr-2"/> Registrar Saída (Uso Diário)</h2>
                <form onSubmit={handleAddReturn} className="space-y-4 bg-red-50 p-4 rounded-md border border-red-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase">Data</label>
                            <input type="date" value={newReturnDate} onChange={e => setNewReturnDate(e.target.value)} className="w-full p-2 border rounded mt-1" required/>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-600 uppercase">Quantidade Usada</label>
                             <input type="number" value={newReturnQuantity} onChange={e => setNewReturnQuantity(Number(e.target.value))} className="w-full p-2 border rounded mt-1" placeholder="Ex: 15" min="1" required/>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors font-semibold">Registrar Saída</button>
                </form>
              </div>

               <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700">Histórico de Uso</h3>
                      <div className="flex gap-2">
                        <button onClick={handleExportReturnCSV} className="text-gray-600 hover:text-green-700" title="Exportar CSV">
                            <FileDown size={18} />
                        </button>
                         <button onClick={() => handlePrintTable('Relatório de Saídas de Etiquetas', returnColumns as any, returnEntries)} className="text-gray-600 hover:text-blue-700" title="Imprimir / PDF">
                            <Printer size={18} />
                        </button>
                      </div>
                  </div>
                   <DataTable<ReturnEntry>
                    columns={returnColumns}
                    data={returnEntries}
                    selection={returnSelection}
                    onSelectionChange={setReturnSelection}
                    renderActions={(item) => (
                         <button onClick={() => handleDeleteReturn(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    )}
                  />
              </div>
          </div>

      </div>
      
      {/* Chart Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md no-print">
           <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><TrendingUp size={20} className="mr-2"/> Evolução de Uso (Últimos 7 dias)</h2>
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#ef4444" name="Quantidade Usada" />
            </BarChart>
           </ResponsiveContainer>
      </div>

      {/* Hidden Print Area */}
      <div id="return-labels-print-area">
        {printableContent}
      </div>

    </div>
  );
};

export default ReturnLabels;
