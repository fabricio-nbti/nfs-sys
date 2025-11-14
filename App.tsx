import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PDV from './components/PDV';
import Products from './components/Products';
import Customers from './components/Customers';
import Invoices from './components/Invoices';
import Companies from './components/Companies';
import AccountsPayable from './components/AccountsPayable';
import AccountsReceivable from './components/AccountsReceivable';
import ServiceOrders from './components/ServiceOrders';
import ElectronicsServiceOrders from './components/ElectronicsServiceOrders';
import AutomotiveServiceOrders from './components/AutomotiveServiceOrders';
import Settings from './components/Settings';
import InvoiceIssuing from './components/InvoiceIssuing';
import { type Page, type AppSettings } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [settings, setSettings] = useState<AppSettings>({
    showMobileRepair: true,
    showElectronicsRepair: true,
    showAutomotiveRepair: true,
    showInvoiceIssuing: true,
  });

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pdv':
        return <PDV />;
      case 'invoices':
        return <Invoices />;
      case 'invoice-issuing':
        return settings.showInvoiceIssuing ? <InvoiceIssuing /> : <Dashboard />;
      case 'service-orders':
        return settings.showMobileRepair ? <ServiceOrders /> : <Dashboard />;
      case 'electronics-service-orders':
        return settings.showElectronicsRepair ? <ElectronicsServiceOrders /> : <Dashboard />;
      case 'automotive-service-orders':
        return settings.showAutomotiveRepair ? <AutomotiveServiceOrders /> : <Dashboard />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'companies':
        return <Companies />;
      case 'accounts-payable':
        return <AccountsPayable />;
      case 'accounts-receivable':
        return <AccountsReceivable />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} settings={settings} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;