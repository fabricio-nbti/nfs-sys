import React, { useState } from 'react';
import { type User } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginProps {
  handleLogin: (user: User) => void;
  setAppView: (view: 'landing' | 'login' | 'register' | 'app') => void;
}

const Login: React.FC<LoginProps> = ({ handleLogin, setAppView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login
    if (email === 'vendedor@minhaempresa.com' && password === '123') {
      const user = MOCK_USERS.find(u => u.email === email);
      if (user) {
        handleLogin(user);
      }
    } else {
      setError('Credenciais inválidas. (Tente o acesso demo ou cadastre-se)');
    }
  };

  const handleAdminLogin = () => {
    const adminUser = MOCK_USERS.find(u => u.role === 'Admin');
    if (adminUser) {
      handleLogin(adminUser);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">NFeSys</h1>
          <p className="text-text-secondary mt-2">Acesse sua conta para continuar</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email ou Telefone</label>
            <input
              id="email"
              name="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="********"
            />
          </div>
          <div className="flex items-center justify-between">
            <a href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</a>
          </div>
          <div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Entrar
            </button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OU</span>
          </div>
        </div>
        <div>
          <button onClick={handleAdminLogin} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Acesso Administrador (Demo)
          </button>
        </div>
        <p className="text-sm text-center text-gray-600">
          Não tem uma conta?{' '}
          <button onClick={() => setAppView('register')} className="font-medium text-primary hover:underline">
            Cadastre-se para um teste de 1 hora
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
