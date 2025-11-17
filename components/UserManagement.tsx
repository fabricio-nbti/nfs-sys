import React, { useState, useMemo } from 'react';
import { MOCK_USERS, MOCK_COMPANIES } from '../constants';
import { type User, type UserPermissions, type Company } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import Modal from './shared/Modal';
import ToggleSwitch from './shared/ToggleSwitch';

const permissionLabels: Record<keyof UserPermissions, string> = {
  dashboard: 'Dashboard',
  pdv: 'PDV',
  invoiceIssuing: 'Emissão de Notas',
  invoices: 'Histórico de Notas',
  serviceOrders: 'O.S. - Celulares',
  electronicsServiceOrders: 'O.S. - Eletrônicos',
  automotiveServiceOrders: 'O.S. - Automotivo',
  securityServiceOrders: 'O.S. - Segurança',
  solarEnergyServiceOrders: 'O.S. - Energia Solar',
  itConsultingServiceOrders: 'O.S. - Consultoria TI',
  products: 'Produtos',
  customers: 'Clientes',
  companies: 'Empresas',
  accountsPayable: 'Contas a Pagar',
  accountsReceivable: 'Contas a Receber',
  shopeeCalc: 'Calculadora Shopee',
  settings: 'Configurações',
  userManagement: 'Gerenciar Usuários',
  // FIX: Added missing couponManagement property.
  couponManagement: 'Gerenciar Cupons',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    if (companyFilter === 'all') {
      return users;
    }
    return users.filter(user => user.companyId === companyFilter);
  }, [users, companyFilter]);

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User },
    { header: 'Empresa', accessor: (user: User) => companies.find(c => c.id === user.companyId)?.name || 'N/A' },
    { header: 'Função', accessor: 'role' as keyof User },
  ];

  const openUserModal = (user: User | null = null) => {
    if (user) {
      setEditingUser({ ...user });
    } else {
      const allPermissionsFalse: UserPermissions = Object.keys(permissionLabels).reduce((acc, key) => {
          (acc as any)[key] = false;
          return acc;
      }, {} as UserPermissions);
      setEditingUser({ name: '', email: '', role: 'Operador', permissions: allPermissionsFalse, companyId: '' });
    }
    setIsUserModalOpen(true);
  };
  
  const handleSaveUser = () => {
    if (!editingUser?.name || !editingUser?.email) {
        alert('Nome e E-mail são obrigatórios.');
        return;
    }
    
    if (editingUser.id) { // Update
        setUsers(users.map(u => u.id === editingUser.id ? editingUser as User : u));
    } else { // Create
        const newUser: User = {
            ...editingUser,
            id: `user-${Date.now()}`
        } as User;
        setUsers([newUser, ...users]);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      name: formData.get('name') as string,
      legalName: formData.get('legalName') as string,
      document: formData.get('document') as string,
      address: formData.get('address') as string,
    };
    setCompanies(prev => [newCompany, ...prev]);
    setIsCompanyModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingUser(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean) => {
    setEditingUser(prev => {
        if (!prev || !prev.permissions) return prev;
        return {
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: value
            }
        }
    });
  };

  const handleBulkDelete = () => {
    if (selection.length > 0) {
      setIsConfirmDeleteModalOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    setUsers(prev => prev.filter(u => !selection.includes(u.id)));
    setSelection([]);
    setIsConfirmDeleteModalOpen(false);
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
        <div className="flex gap-2">
            <button 
              onClick={() => setIsCompanyModalOpen(true)}
              className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700 transition-colors">
              <Building size={20} className="mr-2" />
              Nova Empresa
            </button>
            <button 
              onClick={() => openUserModal()}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
              <Plus size={20} className="mr-2" />
              Novo Usuário
            </button>
        </div>
      </div>

      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <label htmlFor="companyFilter" className="font-semibold text-gray-700">Filtrar por Empresa:</label>
        <select
          id="companyFilter"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selection.length > 0 && (
        <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 p-4 mb-4 rounded-r-lg flex justify-between items-center">
          <span>{selection.length} selecionado(s)</span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 flex items-center"
          >
            <Trash2 size={16} className="mr-1" />
            Excluir Selecionados
          </button>
        </div>
      )}

      <DataTable<User>
        columns={columns}
        data={filteredUsers}
        selection={selection}
        onSelectionChange={setSelection}
        renderActions={(item) => (
          <div className="flex space-x-2">
            <button onClick={() => openUserModal(item)} className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></button>
            <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
          </div>
        )}
      />

      {/* User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser?.id ? 'Editar Usuário' : 'Adicionar Novo Usuário'}>
        {editingUser && (
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input type="text" name="name" value={editingUser.name || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input type="email" name="email" value={editingUser.email || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Função</label>
                <select name="role" value={editingUser.role} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md bg-white">
                  <option value="Admin">Admin</option>
                  <option value="Operador">Operador</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input type="password" placeholder={editingUser.id ? 'Deixe em branco para não alterar' : 'Senha de acesso'} className="mt-1 p-2 w-full border rounded-md" />
              </div>
               <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Vincular à Empresa</label>
                <select name="companyId" value={editingUser.companyId || ''} onChange={handleInputChange} className="mt-1 p-2 w-full border rounded-md bg-white">
                  <option value="">Nenhuma</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4 border-t pt-4">Permissões de Acesso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(permissionLabels) as Array<keyof UserPermissions>).map(key => (
                <ToggleSwitch
                  key={key}
                  label={permissionLabels[key]}
                  enabled={editingUser.permissions ? editingUser.permissions[key] : false}
                  onChange={(enabled) => handlePermissionChange(key, enabled)}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-end sticky bottom-0 bg-white py-4">
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
              <button type="button" onClick={handleSaveUser} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Company Modal */}
       <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Adicionar Nova Empresa">
         <form onSubmit={handleSaveCompany}>
            <div className="space-y-4">
               <input type="text" name="name" placeholder="Nome Fantasia" className="p-2 w-full border rounded-md" required />
               <input type="text" name="legalName" placeholder="Razão Social" className="p-2 w-full border rounded-md" required />
               <input type="text" name="document" placeholder="CNPJ" className="p-2 w-full border rounded-md" required />
               <input type="text" name="address" placeholder="Endereço Completo" className="p-2 w-full border rounded-md" required />
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setIsCompanyModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar Empresa</button>
            </div>
         </form>
       </Modal>

      {/* Confirmation Delete Modal */}
      <Modal isOpen={isConfirmDeleteModalOpen} onClose={() => setIsConfirmDeleteModalOpen(false)} title="Confirmar Exclusão em Massa">
        <div>
            <p className="text-gray-700">
                Tem certeza que deseja excluir permanentemente <strong>{selection.length} usuário(s)</strong> selecionado(s)?
            </p>
            <p className="mt-2 text-sm font-semibold text-red-600">
                Esta ação não poderá ser desfeita.
            </p>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
            <button
                type="button"
                onClick={() => setIsConfirmDeleteModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={confirmBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
                Excluir
            </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
