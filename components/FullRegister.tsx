import React, { useState } from 'react';
import { type User } from '../types';
import { Lock, CreditCard, ShoppingBag } from 'lucide-react';

interface FullRegisterProps {
  handleFullRegister: (user: Omit<User, 'id' | 'role' | 'permissions'>, couponCode: string | null) => void;
  setAppView: (view: 'landing' | 'login' | 'register' | 'full-register' | 'app') => void;
  planDetails: any;
  usedCoupons: string[]; // for checking uniqueness: 'document-COUPONCODE'
}

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const FullRegister: React.FC<FullRegisterProps> = ({ handleFullRegister, setAppView, planDetails, usedCoupons }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        document: '',
        cep: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        cardName: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setError(''); // Clear error on change
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const couponKey = `${formData.document}-${planDetails.appliedCoupon?.code}`;
        if (planDetails.appliedCoupon && usedCoupons.includes(couponKey)) {
            setError('Este cupom já foi utilizado por este CPF/CNPJ.');
            return;
        }
        
        const fullAddress = `${formData.address}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, ${formData.cep}`;
        const newUser: Omit<User, 'id' | 'role' | 'permissions'> = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            document: formData.document,
            address: fullAddress,
        };
        handleFullRegister(newUser, planDetails.appliedCoupon?.code || null);
    };

    if (!planDetails) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-primary mb-4">Oops! Nenhum plano selecionado.</h2>
                <p className="text-text-secondary mb-6">Parece que você chegou aqui sem escolher um plano. Por favor, volte para a página inicial para começar.</p>
                <button 
                    onClick={() => setAppView('landing')} 
                    className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Voltar
                </button>
            </div>
        );
    }
    
    const { finalPeriodPrice, finalMonthlyPrice, billingCycle, prices } = planDetails;
    const totalToPay = finalPeriodPrice || finalMonthlyPrice;
    const periodLabel = {monthly: 'Mês', 'semi-annually': 'Semestre', annually: 'Ano'}[billingCycle];


    return (
        <div className="min-h-screen bg-background flex justify-center items-center p-4 lg:p-8">
            <div className="w-full max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Side - Form */}
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete seu Cadastro</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                             {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

                            <fieldset className="border p-4 rounded-md">
                                <legend className="text-lg font-semibold px-2">Dados Pessoais / Empresa</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo ou Razão Social" required className="p-2 border rounded-md" />
                                    <input type="text" name="document" value={formData.document} onChange={handleChange} placeholder="CPF ou CNPJ" required className="p-2 border rounded-md" />
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail de Contato" required className="p-2 border rounded-md" />
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefone" required className="p-2 border rounded-md" />
                                </div>
                            </fieldset>

                             <fieldset className="border p-4 rounded-md">
                                <legend className="text-lg font-semibold px-2">Endereço</legend>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <input type="text" name="cep" value={formData.cep} onChange={handleChange} placeholder="CEP" required className="p-2 border rounded-md md:col-span-1" />
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Rua / Avenida" required className="p-2 border rounded-md md:col-span-2" />
                                    <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Número" required className="p-2 border rounded-md" />
                                    <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Bairro" required className="p-2 border rounded-md" />
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Cidade" required className="p-2 border rounded-md" />
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Estado" required className="p-2 border rounded-md" />
                                </div>
                            </fieldset>

                            <fieldset className="border p-4 rounded-md">
                                <legend className="text-lg font-semibold px-2">Pagamento</legend>
                                <div className="space-y-4 mt-4">
                                     <input type="text" name="cardName" value={formData.cardName} onChange={handleChange} placeholder="Nome no Cartão" required className="p-2 border rounded-md w-full" />
                                     <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="Número do Cartão" required className="p-2 border rounded-md w-full" />
                                     <div className="grid grid-cols-2 gap-4">
                                        <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="Validade (MM/AA)" required className="p-2 border rounded-md" />
                                        <input type="text" name="cardCvv" value={formData.cardCvv} onChange={handleChange} placeholder="CVV" required className="p-2 border rounded-md" />
                                     </div>
                                </div>
                            </fieldset>
                            
                            <button type="submit" className="w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center text-lg">
                                <Lock size={20} className="mr-2" />
                                Finalizar Assinatura
                            </button>
                             <p className="text-xs text-center text-gray-500">Ao clicar, você concorda com nossos Termos de Serviço.</p>
                        </form>
                    </div>

                    {/* Right Side - Summary */}
                    <div className="bg-indigo-50 rounded-xl shadow-lg p-8 lg:mt-0">
                         <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><ShoppingBag className="mr-3 text-primary"/> Resumo do Pedido</h2>
                         <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg">
                                <p className="font-semibold text-lg">{`Plano NFeSys - ${periodLabel}`}</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                                    <li>Plano Gestão</li>
                                    {planDetails.includeFiscalModule && <li>Módulo Fiscal</li>}
                                    {planDetails.selectedModules.map((m: string) => <li key={m}>{m}</li>)}
                                </ul>
                            </div>

                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-600">Subtotal ({prices.label})</span><span>{formatCurrency(planDetails.subtotal)}</span></div>
                                {planDetails.appliedCoupon && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="font-semibold">Desconto ({planDetails.appliedCoupon.code})</span>
                                        <span className="font-semibold">- {formatCurrency(planDetails.discountAmount)}</span>
                                    </div>
                                )}
                             </div>

                             <div className="border-t-2 border-dashed border-gray-300 pt-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-lg font-bold text-gray-800">Total a pagar hoje</span>
                                    <span className="text-3xl font-extrabold text-primary">{formatCurrency(totalToPay)}</span>
                                </div>
                                <p className="text-right text-gray-600 text-sm">Cobrança por {periodLabel}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullRegister;
