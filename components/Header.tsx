import React, { useState, useEffect } from 'react';
import { UserCircle, Building, Calendar, Clock, Menu } from 'lucide-react';
import { type User, type Company } from '../types';

interface HeaderProps {
  currentUser: User;
  companies: Company[];
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, companies, setIsMobileOpen }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const companyName = companies.find(c => c.id === currentUser.companyId)?.name || 'N/A';

  const formattedDate = currentTime.toLocaleDateString('pt-BR');
  const formattedTime = currentTime.toLocaleTimeString('pt-BR');

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center gap-4 border-b border-gray-200 no-print">
      <div>
        {/* Hamburger Menu for mobile */}
        <button onClick={() => setIsMobileOpen(true)} className="lg:hidden text-gray-600 hover:text-primary">
          <Menu size={28} />
        </button>
        {/* User and Company info for desktop */}
        <div className="hidden lg:flex items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <UserCircle size={20} className="text-primary" />
              <span className="font-semibold">{currentUser.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building size={20} className="text-primary" />
              <span className="font-medium">{companyName}</span>
            </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-secondary" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-secondary" />
          <span className="font-medium">{formattedTime}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;