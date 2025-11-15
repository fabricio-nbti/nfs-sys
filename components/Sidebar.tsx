import React, { useState } from 'react';
import { type Page, type AppSettings } from '../types';
import { BarChart3, ShoppingCart, Receipt, Box, Users, Building, ArrowDownCircle, ArrowUpCircle, Menu, X, Wrench, Tv, Cog, Car, FileText, ShieldCheck, Sun, Network, Calculator, UserCog } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  settings: AppSettings;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; page: Page; currentPage: Page; setCurrentPage: (page: Page) => void; isCollapsed: boolean; }> = ({ icon, label, page, currentPage, setCurrentPage, isCollapsed }) => (
  <li
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${currentPage === page ? 'bg-primary text-white' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'}`}
    onClick={() => setCurrentPage(page)}
  >
    {icon}
    {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, settings }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { icon: <BarChart3 size={20} />, label: 'Dashboard', page: 'dashboard' as Page, condition: true },
    { icon: <ShoppingCart size={20} />, label: 'PDV', page: 'pdv' as Page, condition: true },
    { icon: <FileText size={20} />, label: 'Emissão de Notas', page: 'invoice-issuing' as Page, condition: settings.showInvoiceIssuing },
    { icon: <Receipt size={20} />, label: 'Histórico de Notas', page: 'invoices' as Page, condition: true },
    { icon: <Wrench size={20} />, label: 'O.S. - Celulares', page: 'service-orders' as Page, condition: settings.showMobileRepair },
    { icon: <Tv size={20} />, label: 'O.S. - Eletrônicos', page: 'electronics-service-orders' as Page, condition: settings.showElectronicsRepair },
    { icon: <Car size={20} />, label: 'O.S. - Automotivo', page: 'automotive-service-orders' as Page, condition: settings.showAutomotiveRepair },
    { icon: <ShieldCheck size={20} />, label: 'O.S. - Segurança', page: 'security-service-orders' as Page, condition: settings.showSecuritySystems },
    { icon: <Sun size={20} />, label: 'O.S. - Energia Solar', page: 'solar-energy-service-orders' as Page, condition: settings.showSolarEnergy },
    { icon: <Network size={20} />, label: 'O.S. - Consultoria TI', page: 'it-consulting-service-orders' as Page, condition: settings.showITConsulting },
    { icon: <Box size={20} />, label: 'Produtos', page: 'products' as Page, condition: true },
    { icon: <Users size={20} />, label: 'Clientes', page: 'customers' as Page, condition: true },
    { icon: <Building size={20} />, label: 'Empresas', page: 'companies' as Page, condition: true },
    { icon: <ArrowDownCircle size={20} />, label: 'Contas a Pagar', page: 'accounts-payable' as Page, condition: true },
    { icon: <ArrowUpCircle size={20} />, label: 'Contas a Receber', page: 'accounts-receivable' as Page, condition: true },
    { icon: <Calculator size={20} />, label: 'Calculadora Shopee', page: 'shopee-calc' as Page, condition: true },
  ];

  const adminItems = [
    { icon: <UserCog size={20} />, label: 'Usuários', page: 'user-management' as Page, condition: true },
    { icon: <Cog size={20} />, label: 'Configurações', page: 'settings' as Page, condition: true }
  ];

  const sidebarContent = (
    <div className={`bg-sidebar text-white flex flex-col h-full transition-width duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center p-4 border-b border-gray-700 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h1 className="text-xl font-bold text-white">NFeSys</h1>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:block p-2 rounded-full hover:bg-sidebar-hover">
            <Menu size={24}/>
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col justify-between">
        <ul>
          {navItems.filter(item => item.condition).map(item => (
            <NavItem key={item.page} {...item} currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
          ))}
        </ul>
        <ul>
            <hr className="border-t border-gray-700 my-2 mx-2"/>
             {adminItems.filter(item => item.condition).map(item => (
                <NavItem key={item.page} {...item} currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
            ))}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button onClick={() => setIsMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded-md">
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="relative w-64 h-full">
           <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-white z-10">
            <X size={24} />
          </button>
          {React.cloneElement(sidebarContent, { isCollapsed: false })}
        </div>
        <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsMobileOpen(false)}></div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;