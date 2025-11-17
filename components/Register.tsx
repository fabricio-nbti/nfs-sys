import React, { useState } from 'react';
import { type User } from '../types';

interface RegisterProps {
  handleRegister: (user: Pick<User, 'name' | 'email'>) => void;
  setAppView: (view: 'landing' | 'login' | 'register' | 'app') => void;
}

const Register: React.FC<RegisterProps> = ({ handleRegister, setAppView }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister({ name, email });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Crie sua Conta</h1>
          <p className="text-text-secondary mt-2">Ganhe 1 hora de acesso completo para testar!</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="(11) 98765-4321"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="text-sm font-medium text-gray-700">Senha</label>
            <input
              id="register-password"
              name="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
              Criar conta e iniciar teste
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Já tem uma conta?{' '}
          <button onClick={() => setAppView('login')} className="font-medium text-primary hover:underline">
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
