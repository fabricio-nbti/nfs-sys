
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
import SecurityServiceOrders from './components/SecurityServiceOrders';
import SolarEnergyServiceOrders from './components/SolarEnergyServiceOrders';
import ITConsultingServiceOrders from './components/ITConsultingServiceOrders';
import Settings from './components/Settings';
import InvoiceIssuing from './components/InvoiceIssuing';
import ShopeeCalc from './components/ShopeeCalc';
import ReturnLabels from './components/ReturnLabels';
import UserManagement from './components/UserManagement';
import CouponManagement from './components/CouponManagement';
import Reports from './components/Reports';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import FullRegister from './components/FullRegister';
import DigitalCertificate from './components/DigitalCertificate';
import CollectionPoint from './components/CollectionPoint';
import { type Page, type AppSettings, type User, type Company } from './types';
import { MOCK_USERS, MOCK_COMPANIES } from './constants';

const App: React.FC = () => {
  const [appView, setAppView] = useState<'landing' | 'login' | 'register' | 'full-register' | 'app'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoTimer, setDemoTimer] = useState<number | null>(null);
  const [planDetails, setPlanDetails] = useState<any | null>(null);
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [prefilledCompany, setPrefilledCompany] = useState<Partial<Company> | null>(null);
  const [mainCompany, setMainCompany] = useState<Company | null>(null);


  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [settings, setSettings] = useState<AppSettings>({
    showMobileRepair: true,
    showElectronicsRepair: true,
    showAutomotiveRepair: true,
    showInvoiceIssuing: true,
    showSecuritySystems: true,
    showSolarEnergy: true,
    showITConsulting: true,
    showReturnLabels: true,
    showCollectionPoint: true,
    showShopeeCalc: true,
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);


  useEffect(() => {
    return () => {
      if (demoTimer) clearTimeout(demoTimer);
    };
  }, [demoTimer]);

  const handleLogout = () => {
    if (demoTimer) clearTimeout(demoTimer);
    setCurrentUser(null);
    setDemoTimer(null);
    setAppView('login');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAppView('app');
  };

  const handleRegister = (newUser: Pick<User, 'name' | 'email'>) => {
    const user: User = {
      id: `user-${Date.now()}`,
      role: 'Admin', // Demo user gets admin role
      ...newUser,
      permissions: MOCK_USERS.find(u => u.role === 'Admin')!.permissions, // Give admin permissions for demo
    };
    setCurrentUser(user);
    setAppView('app');

    alert('Cadastro realizado! Sua demonstração de 1 hora começou.');

    const timer = window.setTimeout(() => {
      alert('Sua sessão de demonstração expirou.');
      handleLogout();
    }, 3600 * 1000); // 1 hour
    setDemoTimer(timer);
  };
  
  const handleFullRegister = (newUser: Omit<User, 'id' | 'role' | 'permissions'>, couponCode: string | null) => {
    const user: User = {
      id: `user-${Date.now()}`,
      role: 'Admin',
      ...newUser,
      permissions: MOCK_USERS.find(u => u.role === 'Admin')!.permissions,
    };
    setCurrentUser(user);
    setAppView('app');
    
    if (couponCode && newUser.document) {
      setUsedCoupons(prev => [...prev, `${newUser.document}-${couponCode}`]);
    }
    
    // Auto-fill main company data if a CNPJ was provided during registration
    if (newUser.document && newUser.document.replace(/\D/g, '').length === 14) {
      const newCompany: Company = {
        id: `main-comp-${Date.now()}`,
        name: newUser.name, // Fantasia - can be edited later
        legalName: newUser.name, // Razão Social - can be edited later
        document: newUser.document,
        address: newUser.address || '',
        stateRegistration: '',
        hasCertificate: false,
      };
      setMainCompany(newCompany);
    }
    
    alert('Cadastro e assinatura concluídos com sucesso! Bem-vindo ao NFeSys.');
  };

  const handleCertificateData = (data: Partial<Company>) => {
    setPrefilledCompany(data);
    setCurrentPage('companies');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard settings={settings} />;
      case 'pdv':
        return <PDV />;
      case 'invoices':
        return <Invoices />;
      case 'invoice-issuing':
        return settings.showInvoiceIssuing ? <InvoiceIssuing settings={settings} companies={companies} /> : <Dashboard settings={settings} />;
      case 'service-orders':
        return settings.showMobileRepair ? <ServiceOrders /> : <Dashboard settings={settings} />;
      case 'electronics-service-orders':
        return settings.showElectronicsRepair ? <ElectronicsServiceOrders /> : <Dashboard settings={settings} />;
      case 'automotive-service-orders':
        return settings.showAutomotiveRepair ? <AutomotiveServiceOrders /> : <Dashboard settings={settings} />;
       case 'security-service-orders':
        return settings.showSecuritySystems ? <SecurityServiceOrders /> : <Dashboard settings={settings} />;
      case 'solar-energy-service-orders':
        return settings.showSolarEnergy ? <SolarEnergyServiceOrders /> : <Dashboard settings={settings} />;
      case 'it-consulting-service-orders':
        return settings.showITConsulting ? <ITConsultingServiceOrders /> : <Dashboard settings={settings} />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'companies':
        return <Companies companies={companies} setCompanies={setCompanies} prefilledCompany={prefilledCompany} onPrefillConsumed={() => setPrefilledCompany(null)} />;
      case 'digital-certificate':
        return <DigitalCertificate companies={companies} onCompanyExtracted={handleCertificateData} setCurrentPage={setCurrentPage} />;
      case 'accounts-payable':
        return <AccountsPayable />;
      case 'accounts-receivable':
        return <AccountsReceivable />;
      case 'shopee-calc':
        return settings.showShopeeCalc ? <ShopeeCalc /> : <Dashboard settings={settings} />;
      case 'return-labels':
        return settings.showReturnLabels ? <ReturnLabels /> : <Dashboard settings={settings} />;
      case 'collection-point':
        return settings.showCollectionPoint ? <CollectionPoint /> : <Dashboard settings={settings} />;
      case 'reports':
        return <Reports />;
      case 'user-management':
        return <UserManagement />;
      case 'coupon-management':
        return <CouponManagement />;
      case 'settings':
        return <Settings 
                  settings={settings} 
                  setSettings={setSettings}
                  mainCompany={mainCompany}
                  setMainCompany={setMainCompany}
                />;
      default:
        return <Dashboard settings={settings} />;
    }
  };

  if (appView === 'landing') {
    return <LandingPage setAppView={setAppView} setPlanDetails={setPlanDetails} />;
  }
  if (appView === 'login') {
    return <Login handleLogin={handleLogin} setAppView={setAppView} />;
  }
  if (appView === 'register') {
    return <Register handleRegister={handleRegister} setAppView={setAppView} />;
  }
  if (appView === 'full-register') {
    return <FullRegister 
      handleFullRegister={handleFullRegister} 
      setAppView={setAppView} 
      planDetails={planDetails}
      usedCoupons={usedCoupons}
    />;
  }

  if (appView === 'app' && currentUser) {
    return (
      <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          settings={settings} 
          handleLogout={handleLogout}
          permissions={currentUser.permissions}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            currentUser={currentUser} 
            companies={MOCK_COMPANIES} 
            setIsMobileOpen={setIsMobileOpen} 
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <div className="container mx-auto px-6 py-8">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Fallback if state is inconsistent
  return <Login handleLogin={handleLogin} setAppView={setAppView} />;
};

export default App;