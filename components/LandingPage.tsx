import React, { useState, useMemo } from 'react';
import { CheckCircle, ArrowRight, ShoppingCart, FileText, Wrench, Banknote, Star, Tag } from 'lucide-react';
import { MOCK_COUPONS } from '../constants';
import { type Coupon } from '../types';

interface LandingPageProps {
  setAppView: (view: 'landing' | 'login' | 'register' | 'full-register' | 'app') => void;
  setPlanDetails: (details: any) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg text-center shadow-md hover:shadow-xl transition-shadow transform hover:-translate-y-1">
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-primary mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-text-secondary">{description}</p>
  </div>
);

const TestimonialCard: React.FC<{ quote: string; name: string; company: string; }> = ({ quote, name, company }) => (
    <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
        </div>
        <p className="text-text-secondary mb-6">"{quote}"</p>
        <div>
            <p className="font-bold text-gray-800">{name}</p>
            <p className="text-sm text-gray-500">{company}</p>
        </div>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ setAppView, setPlanDetails }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'semi-annually' | 'annually'>('annually');
    const [includeFiscalModule, setIncludeFiscalModule] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponError, setCouponError] = useState('');

    const osModules = {
        mobile: 'O.S. - Celulares & Notebooks',
        electronics: 'O.S. - Eletrônicos',
        automotive: 'O.S. - Automotivo',
        security: 'O.S. - Segurança Eletrônica',
        solar: 'O.S. - Energia Solar',
        it: 'O.S. - Consultoria TI',
    };
    const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({ mobile: true });

    const prices = {
        monthly: { base: 69.90, fiscal: 30.00, module: 29.90, label: '/mês' },
        'semi-annually': { base: 62.90, fiscal: 27.00, module: 26.90, label: '/mês' },
        annually: { base: 55.90, fiscal: 24.00, module: 23.90, label: '/mês' },
    };

    const handleModuleToggle = (key: string) => {
        setSelectedModules(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleApplyCoupon = () => {
        const code = couponCode.toUpperCase().trim();
        const coupon = MOCK_COUPONS.find(c => c.code.toUpperCase() === code);

        if (!coupon) {
            setAppliedCoupon(null);
            setCouponError('Cupom inválido.');
            return;
        }
        if (coupon.status !== 'active') {
            setAppliedCoupon(null);
            setCouponError('Este cupom não está ativo.');
            return;
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            setAppliedCoupon(null);
            setCouponError('Este cupom atingiu o limite de usos.');
            return;
        }
        
        setAppliedCoupon(coupon);
        setCouponError('');
    };

    const { subtotal, totalModules, discountAmount, finalMonthlyPrice, finalPeriodPrice } = useMemo(() => {
        const currentPrice = prices[billingCycle];
        const selectedCount = Object.values(selectedModules).filter(Boolean).length;
        
        let monthlySubtotal = currentPrice.base;
        if (includeFiscalModule) monthlySubtotal += currentPrice.fiscal;
        if (selectedCount > 1) monthlySubtotal += (selectedCount - 1) * currentPrice.module;

        let discountValue = 0;
        if (appliedCoupon) {
            discountValue = monthlySubtotal * appliedCoupon.discount;
        }

        const finalPrice = monthlySubtotal - discountValue;
        
        let periodTotal: number | null = null;
        if (billingCycle === 'semi-annually') {
            periodTotal = finalPrice * 6;
        } else if (billingCycle === 'annually') {
            periodTotal = finalPrice * 12;
        }

        return { 
            subtotal: monthlySubtotal, 
            totalModules: selectedCount, 
            discountAmount: discountValue,
            finalMonthlyPrice: finalPrice,
            finalPeriodPrice: periodTotal,
        };
    }, [billingCycle, selectedModules, includeFiscalModule, prices, appliedCoupon]);

    const handleProceedToRegister = () => {
        const plan = {
            billingCycle,
            includeFiscalModule,
            selectedModules: Object.entries(selectedModules).filter(([, v]) => v).map(([k,]) => osModules[k as keyof typeof osModules]),
            subtotal,
            appliedCoupon,
            discountAmount,
            finalMonthlyPrice,
            finalPeriodPrice,
            prices: prices[billingCycle],
            totalModules
        };
        setPlanDetails(plan);
        setAppView('full-register');
    };
    
  return (
    <div className="bg-background text-text-primary">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">NFeSys</h1>
          <button onClick={() => setAppView('login')} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
            Acessar Sistema
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </header>
      
      {/* Hero Section */}
      <section 
        className="relative text-white py-20 md:py-32" 
        style={{
            backgroundImage: `linear-gradient(rgba(79, 70, 229, 0.8), rgba(79, 70, 229, 0.8)), url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">A plataforma definitiva para <br/> a gestão do seu negócio.</h2>
          <p className="text-lg md:text-xl text-indigo-200 max-w-3xl mx-auto mb-8">Elimine a complexidade da sua rotina. Emita notas, gerencie O.S., controle o financeiro e venda no PDV com uma solução completa e intuitiva.</p>
          <a href="#pricing" className="bg-secondary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-emerald-600 transition-colors shadow-lg">Ver Planos e Começar</a>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
          <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-800">Uma plataforma, todas as soluções</h2>
                  <p className="text-text-secondary mt-2 max-w-2xl mx-auto">Centralize sua operação com ferramentas poderosas e fáceis de usar, projetadas para impulsionar seu crescimento.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <FeatureCard icon={<ShoppingCart size={32}/>} title="PDV Rápido e Intuitivo" description="Realize vendas ágeis, emita cupons e gerencie seu caixa de forma descomplicada." />
                  <FeatureCard icon={<FileText size={32}/>} title="Gestão Fiscal Completa" description="Emita NFe, NFCe e NFSe para MEI com poucos cliques. Mantenha-se em dia com suas obrigações." />
                  <FeatureCard icon={<Wrench size={32}/>} title="Ordens de Serviço Especializadas" description="Módulos flexíveis para qualquer ramo de serviço, com acompanhamento online para o cliente." />
                  <FeatureCard icon={<Banknote size={32}/>} title="Financeiro Inteligente" description="Controle contas a pagar e receber, acompanhe o fluxo de caixa e tome decisões baseadas em dados." />
              </div>
          </div>
      </section>

      {/* Visual Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 space-y-20">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="pr-8">
                    <span className="text-primary font-semibold">GESTÃO VISUAL</span>
                    <h3 className="text-3xl font-bold text-gray-800 mt-2 mb-4">Tenha uma visão 360° do seu negócio</h3>
                    <p className="text-text-secondary mb-6">Nosso dashboard inteligente transforma dados em insights. Acompanhe faturamento, O.S. em andamento e baixo estoque em tempo real, permitindo decisões rápidas e estratégicas.</p>
                </div>
                <div className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard do sistema NFeSys" className="w-full h-auto" />
                </div>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform order-2 md:order-1 overflow-hidden">
                     <img src="https://images.unsplash.com/photo-1581092921440-4c74b3a17c2f?q=80&w=2070&auto=format&fit=crop" alt="Técnico trabalhando com eletrônicos" className="w-full h-auto" />
                </div>
                <div className="pl-8 order-1 md:order-2">
                    <span className="text-primary font-semibold">ORDENS DE SERVIÇO</span>
                    <h3 className="text-3xl font-bold text-gray-800 mt-2 mb-4">Organização e profissionalismo do início ao fim</h3>
                    <p className="text-text-secondary mb-6">Gerencie cada etapa do serviço com módulos especializados. Registre avarias em diagramas, anexe mídias, controle peças e custos, e ofereça ao seu cliente um link de acompanhamento online.</p>
                </div>
            </div>
             {/* Feature 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="pr-8">
                    <span className="text-primary font-semibold">EXCLUSIVO</span>
                    <h3 className="text-3xl font-bold text-gray-800 mt-2 mb-4">Maximize seus lucros como Agência Shopee</h3>
                    <p className="text-text-secondary mb-6">Nossa calculadora decodifica as comissões da Shopee. Insira os dados de pacotes e veja seu faturamento instantaneamente, incluindo bônus do programa de excelência. Chega de planilhas!</p>
                </div>
                <div className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1586528116311-06924151d18a?q=80&w=2070&auto=format&fit=crop" alt="Galpão com pacotes da Shopee" className="w-full h-auto" />
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
          <div className="container mx-auto px-6">
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-800">O que nossos clientes dizem</h2>
                  <p className="text-text-secondary mt-2">A confiança de quem usa o NFeSys no dia a dia.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                  <TestimonialCard 
                    quote="O NFeSys centralizou toda a minha operação. O módulo de O.S. para eletrônicos é fantástico e o dashboard me dá a clareza que eu precisava."
                    name="Carlos Mendes"
                    company="CM Eletrônica"
                  />
                  <TestimonialCard 
                    quote="A emissão de notas de serviço para MEI ficou muito mais simples. Economizo horas toda semana e o suporte é sempre ágil."
                    name="Juliana Ferreira"
                    company="JF Consultoria TI"
                  />
                  <TestimonialCard 
                    quote="Finalmente um sistema que entende a rotina de uma oficina. O controle de peças e o link para o cliente são diferenciais que conquistaram minha equipe."
                    name="Roberto Almeida"
                    company="Almeida Auto Center"
                  />
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800">Planos flexíveis para o seu negócio</h2>
                <p className="text-text-secondary mt-2">Escolha o ciclo de pagamento e os módulos que fazem sentido para você.</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-lg shadow-sm">
                    <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 text-sm font-semibold rounded-md ${billingCycle === 'monthly' ? 'bg-primary text-white' : 'text-gray-600'}`}>Mensal</button>
                    <button onClick={() => setBillingCycle('semi-annually')} className={`px-4 py-2 text-sm font-semibold rounded-md ${billingCycle === 'semi-annually' ? 'bg-primary text-white' : 'text-gray-600'}`}>Semestral <span className="text-xs bg-secondary text-white rounded-full px-2 py-0.5 ml-1">10% OFF</span></button>
                    <button onClick={() => setBillingCycle('annually')} className={`px-4 py-2 text-sm font-semibold rounded-md ${billingCycle === 'annually' ? 'bg-primary text-white' : 'text-gray-600'}`}>Anual <span className="text-xs bg-secondary text-white rounded-full px-2 py-0.5 ml-1">20% OFF</span></button>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3 bg-white p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4">Configure seu plano NFeSys</h3>
                    <div className="border-t border-b py-4">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">Plano Gestão</p>
                            <p className="font-bold">R$ {prices[billingCycle].base.toFixed(2).replace('.',',')}{prices[billingCycle].label}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Inclui PDV, Produtos, Financeiro, Clientes, Empresas e <strong className="text-primary">1 Módulo de O.S. grátis</strong>.</p>
                    </div>

                    <h4 className="font-bold mt-6 mb-2">Adicionais de Alto Valor:</h4>
                    <div className="relative">
                        <label htmlFor="fiscal-module" className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${includeFiscalModule ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}>
                            <input type="checkbox" id="fiscal-module" checked={includeFiscalModule} onChange={() => setIncludeFiscalModule(prev => !prev)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                            <span className="ml-3 font-medium text-gray-800">Módulo de Emissão Fiscal (NFe, NFCe, NFSe)</span>
                            <span className="ml-auto font-bold text-gray-800">+ R$ {prices[billingCycle].fiscal.toFixed(2).replace('.',',')}</span>
                        </label>
                        <span className="absolute -top-2 right-4 bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">MAIS POPULAR</span>
                    </div>

                    <h4 className="font-bold mt-6 mb-2">Selecione os Módulos de Ordem de Serviço:</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {Object.entries(osModules).map(([key, label]) => (
                            <label key={key} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedModules[key] ? 'border-primary bg-indigo-50' : 'border-gray-200'}`}>
                                <input type="checkbox" checked={!!selectedModules[key]} onChange={() => handleModuleToggle(key)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                <span className="ml-3 text-sm font-medium text-gray-800">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-lg sticky top-24">
                    <h3 className="text-xl font-bold mb-4">Resumo do seu Plano</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Plano Gestão ({ {monthly: 'Mensal', 'semi-annually': 'Semestral', annually: 'Anual'}[billingCycle] })</span>
                            <span className="font-medium">R$ {prices[billingCycle].base.toFixed(2).replace('.',',')}</span>
                        </div>
                         {includeFiscalModule && (
                             <div className="flex justify-between">
                                <span className="text-gray-600">Módulo Fiscal</span>
                                <span className="font-medium">R$ {prices[billingCycle].fiscal.toFixed(2).replace('.',',')}</span>
                            </div>
                        )}
                        {totalModules > 1 && (
                             <div className="flex justify-between">
                                <span className="text-gray-600">{totalModules - 1} Módulo(s) de O.S. extra</span>
                                <span className="font-medium">R$ {((totalModules - 1) * prices[billingCycle].module).toFixed(2).replace('.',',')}</span>
                            </div>
                        )}
                        <div className="border-t pt-4">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Cupom de desconto" 
                                    value={couponCode}
                                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                                    className="p-2 border rounded-md w-full text-sm"
                                />
                                <button onClick={handleApplyCoupon} className="bg-gray-600 text-white px-4 rounded-md hover:bg-gray-700 text-sm font-semibold">Aplicar</button>
                            </div>
                            {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                            {appliedCoupon && <p className="text-green-600 text-xs mt-1">Cupom '{appliedCoupon.code}' aplicado com sucesso!</p>}
                        </div>

                         {appliedCoupon && (
                            <div className="flex justify-between text-green-600">
                                <span>Desconto ({appliedCoupon.discount * 100}%)</span>
                                <span className="font-medium">- R$ {discountAmount.toFixed(2).replace('.',',')}</span>
                            </div>
                        )}

                         <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between text-lg font-semibold text-gray-800">
                                <span>Valor Mensal</span>
                                <span>R$ {finalMonthlyPrice.toFixed(2).replace('.',',')}{prices[billingCycle].label}</span>
                            </div>
                            {finalPeriodPrice && (
                                <div className="flex justify-between text-lg font-bold text-primary mt-2">
                                    <span>Total a pagar</span>
                                    <span>R$ {finalPeriodPrice.toFixed(2).replace('.',',')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={handleProceedToRegister} className="mt-6 w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center">
                        Assinar e Cadastrar
                    </button>
                    <p className="text-xs text-center mt-2 text-gray-500">Cadastro completo necessário para a compra.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white">Pronto para simplificar sua gestão?</h2>
            <p className="text-indigo-200 mt-2 mb-6 max-w-xl mx-auto">Junte-se a centenas de empresas que transformaram seus negócios com o NFeSys.</p>
            <a href="#pricing" className="bg-white text-primary font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-100 transition-colors shadow-lg">Quero começar agora</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-gray-300 py-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} NFeSys. Todos os direitos reservados.</p>
          <p className="text-sm mt-2">Sistema de Gestão e Emissão Fiscal.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
