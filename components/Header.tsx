
import React, { useState, useEffect, useRef } from 'react';
import { Building, Menu, Search, Bell, ChevronDown, User as UserIcon, Settings, LogOut, X, Check } from 'lucide-react';
import { type User, type Company } from '../types';

interface HeaderProps {
  currentUser: User;
  companies: Company[];
  setIsMobileOpen: (isOpen: boolean) => void;
  handleLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, companies, setIsMobileOpen, handleLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute is enough for UI
    return () => clearInterval(timer);
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setShowUserMenu(false);
        }
        if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const companyName = companies.find(c => c.id === currentUser.companyId)?.name || 'Empresa Padrão';

  const formattedDate = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formattedTime = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
  };

  const mockNotifications = [
    { id: 1, title: 'Novo Pedido #2023', time: 'Há 5 min', unread: true },
    { id: 2, title: 'Estoque Baixo: Teclado', time: 'Há 1 hora', unread: true },
    { id: 3, title: 'Fatura Paga', time: 'Há 3 horas', unread: false },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-20 flex items-center justify-between px-6 z-30 sticky top-0 no-print">
      
      {/* Left: Mobile Menu & Company Context */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        
        {/* Company Visual Dropdown */}
        <div className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 p-2 -ml-2 rounded-xl cursor-pointer transition-all group relative">
            <div className="w-10 h-10 bg-indigo-50 text-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                <Building size={20} />
            </div>
            <div className="hidden md:block">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Empresa Atual</p>
                <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-800 leading-tight">{companyName}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                </div>
            </div>
        </div>
      </div>

      {/* Center: Global Search (Desktop) */}
      <div className="hidden md:block flex-1 max-w-md mx-8">
         <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
               type="text" 
               placeholder="Pesquisar clientes, notas, produtos..." 
               className="w-full bg-gray-100 border-none outline-none ring-0 focus:ring-2 focus:ring-primary/20 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all placeholder-gray-400"
            />
         </div>
      </div>

      {/* Right: Widgets & Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Date & Time (Desktop XL) */}
        <div className="hidden xl:flex flex-col items-end text-right border-r border-gray-100 pr-6">
            <span className="text-lg font-bold text-gray-800 leading-none">{formattedTime}</span>
            <span className="text-xs text-gray-500 capitalize">{formattedDate}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifMenuRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 text-gray-400 hover:bg-gray-100 hover:text-primary rounded-full transition-colors ${showNotifications ? 'bg-gray-100 text-primary' : ''}`}
            >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Notificações</h3>
                        <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Marcar como lidas</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {mockNotifications.map(notif => (
                            <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <div>
                                    <p className={`text-sm ${notif.unread ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{notif.title}</p>
                                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-100">
                        <button className="text-sm text-primary font-medium hover:underline">Ver todas as notificações</button>
                    </div>
                </div>
            )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
            <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-2 border-l border-gray-100 sm:border-none cursor-pointer group select-none"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block">{currentUser.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">
                    {getInitials(currentUser.name)}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </div>

            {/* User Dropdown */}
            {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <p className="font-bold text-gray-800">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                    <div className="py-2">
                        <button className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center transition-colors">
                            <UserIcon size={16} className="mr-3" />
                            Meu Perfil
                        </button>
                        <button className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center transition-colors">
                            <Settings size={16} className="mr-3" />
                            Configurações
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button 
                            onClick={() => { handleLogout && handleLogout(); setShowUserMenu(false); }}
                            className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                        >
                            <LogOut size={16} className="mr-3" />
                            Sair do Sistema
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
