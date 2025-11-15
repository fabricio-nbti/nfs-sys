import { type Product, type Customer, type Company, type Invoice, type AccountTransaction, InvoiceStatus, type ServiceOrder, ServiceOrderStatus } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Notebook Gamer Pro', price: 7500, stock: 15, category: 'Eletrônicos', sku: 'NTB-GMR-001' },
  { id: '2', name: 'Monitor Ultrawide 34"', price: 2800, stock: 30, category: 'Monitores', sku: 'MON-UW-034' },
  { id: '3', name: 'Teclado Mecânico RGB', price: 450, stock: 50, category: 'Periféricos', sku: 'TEC-MEC-RGB' },
  { id: '4', name: 'Mouse Sem Fio Ergonômico', price: 250, stock: 80, category: 'Periféricos', sku: 'MSE-ERG-WLS' },
  { id: '5', name: 'Cadeira Gamer Confort', price: 1200, stock: 25, category: 'Móveis', sku: 'CAD-GMR-CFT' },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'João da Silva', email: 'joao.silva@email.com', phone: '(11) 98765-4321', document: '123.456.789-00', address: 'Rua dos Pinheiros, 789, São Paulo, SP, 05422-011' },
  { id: '2', name: 'Maria Oliveira', email: 'maria.o@email.com', phone: '(21) 91234-5678', document: '987.654.321-99', address: 'Av. Copacabana, 1234, Rio de Janeiro, RJ, 22070-002' },
  { id: '3', name: 'Tech Solutions Ltda', email: 'contato@techsolutions.com', phone: '(31) 3333-4444', document: '12.345.678/0001-99', address: 'Rua da Bahia, 567, Belo Horizonte, MG, 30160-010' },
];

export const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'Minha Empresa MEI', legalName: 'Minha Empresa de Tecnologia MEI', document: '99.888.777/0001-66', address: 'Rua Principal, 123, Centro, São Paulo, SP - 01001-000', stateRegistration: '111.222.333.444' }
];

const mockIssuer = MOCK_COMPANIES[0];

export const MOCK_INVOICES: Invoice[] = [
  { 
    id: '2024001', 
    customer: MOCK_CUSTOMERS[2],
    issuer: mockIssuer,
    issueDate: '2024-07-25', 
    exitDate: '2024-07-25',
    series: '001',
    accessKey: '3524 0799 8887 7700 0166 5500 1000 0000 0110 0000 0014',
    protocol: '135240000000001',
    items: [
        { id: 1, code: 'NTB-GMR-001', description: 'Notebook Gamer Pro i9 32GB RAM 1TB SSD', ncm: '8471.30.19', csosn: '102', cfop: '5102', unit: 'UN', quantity: 1, unitPrice: 7500.00, totalPrice: 7500.00 },
        { id: 2, code: 'MON-UW-034', description: 'Monitor Ultrawide 34" 4K', ncm: '8528.52.20', csosn: '102', cfop: '5102', unit: 'UN', quantity: 2, unitPrice: 2800.00, totalPrice: 5600.00 }
    ],
    totalProducts: 13100.00,
    totalInvoice: 13100.00,
    status: InvoiceStatus.Issued, 
    type: 'NFe',
    taxInfo: {
      baseICMS: 13100.00, valueICMS: 2358.00, baseST: 0, valueST: 0,
      valueIPI: 0, valuePIS: 0, valueCOFINS: 0, valueFrete: 0,
      valueSeguro: 0, outrasDespesas: 0
    }
  },
  { 
    id: '2024002', 
    customer: MOCK_CUSTOMERS[1],
    issuer: mockIssuer,
    issueDate: '2024-07-26', 
    exitDate: '2024-07-26',
    series: '001',
    accessKey: '3524 0799 8887 7700 0166 5500 1000 0000 0210 0000 0025',
    protocol: '135240000000002',
    items: [
        { id: 1, code: 'TEC-MEC-RGB', description: 'Teclado Mecânico RGB', ncm: '8471.60.52', csosn: '102', cfop: '5102', unit: 'UN', quantity: 1, unitPrice: 450.00, totalPrice: 450.00 },
    ],
    totalProducts: 450.00,
    totalInvoice: 450.00,
    status: InvoiceStatus.Pending, 
    type: 'NFCe',
    taxInfo: { baseICMS: 450, valueICMS: 81, baseST: 0, valueST: 0, valueIPI: 0, valuePIS: 0, valueCOFINS: 0, valueFrete: 0, valueSeguro: 0, outrasDespesas: 0 }
  },
  { 
    id: '2024003', 
    customer: MOCK_CUSTOMERS[0],
    issuer: mockIssuer,
    issueDate: '2024-07-27', 
    exitDate: '2024-07-27',
    series: '001',
    accessKey: '3524 0799 8887 7700 0166 5500 1000 0000 0310 0000 0036',
    protocol: '135240000000003',
    items: [
        { id: 1, code: 'SERV-001', description: 'Manutenção de Notebook - Troca de Tela', ncm: '00', csosn: '102', cfop: '5933', unit: 'SV', quantity: 1, unitPrice: 200.00, totalPrice: 200.00 },
    ],
    totalProducts: 200.00,
    totalInvoice: 200.00,
    status: InvoiceStatus.Canceled, 
    type: 'NFSe-MEI',
    taxInfo: { baseICMS: 0, valueICMS: 0, baseST: 0, valueST: 0, valueIPI: 0, valuePIS: 0, valueCOFINS: 0, valueFrete: 0, valueSeguro: 0, outrasDespesas: 0 }
  },
];

export const MOCK_ACCOUNTS_PAYABLE: AccountTransaction[] = [
    { id: '1', description: 'Aluguel Escritório', category: 'Despesas Fixas', dueDate: '2024-08-05', amount: 2500, status: 'Pending' },
    { id: '2', description: 'Fornecedor de Hardware', category: 'Compras', dueDate: '2024-07-20', paymentDate: '2024-07-18', amount: 8900, status: 'Paid' },
    { id: '3', description: 'Conta de Internet', category: 'Infraestrutura', dueDate: '2024-07-10', amount: 350, status: 'Overdue' },
];

export const MOCK_ACCOUNTS_RECEIVABLE: AccountTransaction[] = [
    { id: '1', description: 'Venda NFe 2024001', category: 'Vendas', dueDate: '2024-07-15', paymentDate: '2024-07-14', amount: 13100, status: 'Paid' },
    { id: '2', description: 'Venda NFCe 2024002', category: 'Vendas', dueDate: '2024-08-05', amount: 450, status: 'Pending' },
    { id: '3', description: 'Serviço NFSe 102', category: 'Serviços', dueDate: '2024-07-01', amount: 1500, status: 'Overdue' },
];

export const MOCK_SERVICE_ORDERS: ServiceOrder[] = [
  { id: 'OS-001', customerName: 'João da Silva', customerPhone: '(11) 98765-4321', customerEmail: 'joao.silva@email.com', deviceType: 'Notebook', deviceBrand: 'Dell', deviceModel: 'Inspiron 15', imeiOrSerial: 'ABC123XYZ', accessories: 'Carregador original', reportedProblem: 'Não liga, sem sinal de vida.', technicianNotes: 'Troca da placa-mãe.', partsUsed: '1x Placa-mãe Dell P/N 12345', mediaUrls: ['https://via.placeholder.com/150/0000FF/FFFFFF?text=Foto+1', 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Foto+2'], status: ServiceOrderStatus.InProgress, creationDate: '2024-07-28', serviceCost: 150, partsCost: 300, totalValue: 450.00, publicLink: 'https://example.com/os/view/a1b2c3d4' },
  { id: 'OS-002', customerName: 'Maria Oliveira', customerPhone: '(21) 91234-5678', customerEmail: 'maria.o@email.com', deviceType: 'Celular', deviceBrand: 'Apple', deviceModel: 'iPhone 13', imeiOrSerial: '123456789012345', accessories: 'Apenas aparelho', reportedProblem: 'Tela trincada após queda.', status: ServiceOrderStatus.WaitingParts, creationDate: '2024-07-27', publicLink: 'https://example.com/os/view/e5f6g7h8' },
  { id: 'OS-003', customerName: 'Tech Solutions Ltda', customerPhone: '(31) 3333-4444', customerEmail: 'contato@techsolutions.com', deviceType: 'Notebook', deviceBrand: 'Lenovo', deviceModel: 'ThinkPad T490', imeiOrSerial: 'XYZ987ABC', accessories: 'Fonte de alimentação', reportedProblem: 'Lentidão excessiva e superaquecimento.', technicianNotes: 'Limpeza interna e troca da pasta térmica.', status: ServiceOrderStatus.Completed, creationDate: '2024-07-25', serviceCost: 250, totalValue: 250.00, publicLink: 'https://example.com/os/view/i9j0k1l2' },
  { id: 'OS-004', customerName: 'Carlos Pereira', customerPhone: '(41) 99999-8888', customerEmail: 'carlos.p@email.com', deviceType: 'Celular', deviceBrand: 'Samsung', deviceModel: 'Galaxy S22', imeiOrSerial: '543210987654321', accessories: 'Nenhum', reportedProblem: 'Bateria não segura carga.', status: ServiceOrderStatus.Pending, creationDate: '2024-07-29', publicLink: 'https://example.com/os/view/m3n4o5p6' },
];

export const MOCK_ELECTRONICS_SERVICE_ORDERS: ServiceOrder[] = [
    { id: 'OSE-001', customerName: 'Ana Costa', customerPhone: '(81) 98877-6655', customerEmail: 'ana.costa@email.com', deviceType: 'TV', deviceBrand: 'LG', deviceModel: 'OLED55C1', imeiOrSerial: 'LG55C1-1234', accessories: 'Controle remoto', reportedProblem: 'Não mostra imagem, só tem áudio.', technicianNotes: 'Troca da placa T-CON.', partsUsed: '1x Placa T-CON LG P/N 54321', status: ServiceOrderStatus.InProgress, creationDate: '2024-07-28', serviceCost: 200, partsCost: 350, totalValue: 550.00, publicLink: 'https://example.com/os/view/f4g5h6j7' },
    { id: 'OSE-002', customerName: 'Pedro Martins', customerPhone: '(71) 99111-2233', customerEmail: 'pedro.m@email.com', deviceType: 'Aparelho de Som', deviceBrand: 'Sony', deviceModel: 'MHC-V13', imeiOrSerial: 'SNY-V13-5678', accessories: 'Nenhum', reportedProblem: 'Não lê CD e porta do disco não abre.', status: ServiceOrderStatus.WaitingParts, creationDate: '2024-07-27', publicLink: 'https://example.com/os/view/k8l9m0n1' },
    { id: 'OSE-003', customerName: 'Fernanda Lima', customerPhone: '(21) 99900-1122', customerEmail: 'fe.lima@email.com', deviceType: 'Microondas', deviceBrand: 'Electrolux', deviceModel: 'MTO30', imeiOrSerial: 'ELX-MTO30-9012', accessories: 'Prato de vidro', reportedProblem: 'Não esquenta os alimentos.', technicianNotes: 'Troca do magnetron.', status: ServiceOrderStatus.Completed, creationDate: '2024-07-25', serviceCost: 180, partsCost: 120, totalValue: 300.00, publicLink: 'https://example.com/os/view/b2c3d4e5' },
];

export const MOCK_AUTOMOTIVE_SERVICE_ORDERS: ServiceOrder[] = [
    { id: 'OSA-001', customerName: 'Roberto Andrade', customerPhone: '(11) 95555-1234', customerEmail: 'roberto.a@email.com', deviceType: 'Carro', deviceBrand: 'Toyota', deviceModel: 'Corolla', year: '2022', vehiclePlate: 'SAD-4321', imeiOrSerial: '9BR...CHASSI...', accessories: 'Documento e chave reserva', reportedProblem: 'Revisão de 20.000 km e barulho na suspensão dianteira.', technicianNotes: 'Troca de óleo, filtros e bieletas da suspensão.', partsUsed: '1x Kit Revisão Corolla, 2x Bieletas', status: ServiceOrderStatus.Completed, creationDate: '2024-07-29', serviceCost: 450, partsCost: 380, totalValue: 830.00, publicLink: 'https://example.com/os/view/q1w2e3r4' },
    { id: 'OSA-002', customerName: 'Luciana Mendes', customerPhone: '(19) 94444-5678', customerEmail: 'luciana.m@email.com', deviceType: 'Carro', deviceBrand: 'Honda', deviceModel: 'Fit', year: '2019', vehiclePlate: 'FIT-2019', reportedProblem: 'Ar condicionado não está gelando.', status: ServiceOrderStatus.InProgress, creationDate: '2024-07-28', publicLink: 'https://example.com/os/view/t5y6u7i8' },
    { id: 'OSA-003', customerName: 'Jorge Santos', customerPhone: '(21) 93333-9012', customerEmail: 'jorge.s@email.com', deviceType: 'Moto', deviceBrand: 'Yamaha', deviceModel: 'Lander 250', year: '2023', vehiclePlate: 'YMH-0250', reportedProblem: 'Pneu traseiro furado e troca de relação.', status: ServiceOrderStatus.Pending, creationDate: '2024-07-30', publicLink: 'https://example.com/os/view/o9p0a1s2' },
];

export const MOCK_SECURITY_SERVICE_ORDERS: ServiceOrder[] = [
    { id: 'OSS-001', customerName: 'Condomínio Residencial Park', customerPhone: '(11) 3232-5566', customerEmail: 'sindico@condpark.com', deviceType: 'Sistema de CFTV', deviceBrand: 'Intelbras', deviceModel: 'Multi HD', imeiOrSerial: 'Rua das Flores, 100 - Bairro Jardim', accessories: 'Acesso ao telhado liberado', reportedProblem: 'Instalação de 8 novas câmeras nas áreas comuns e substituição do DVR antigo.', technicianNotes: 'DVR de 16 canais instalado. Passagem de cabos via eletrodutos existentes.', partsUsed: '1x DVR Intelbras 16ch, 8x Câmera Dome VHD 1220, 1x HD Purple 4TB, 200m Cabo Coaxial', status: ServiceOrderStatus.Completed, creationDate: '2024-07-29', serviceCost: 1200, partsCost: 2800, totalValue: 4000.00, publicLink: 'https://example.com/os/view/sec001' },
    { id: 'OSS-002', customerName: 'Mariana Costa', customerPhone: '(81) 98877-6655', customerEmail: 'mariana.c@email.com', deviceType: 'Alarme Monitorado', deviceBrand: 'JFL', deviceModel: 'Active 20', imeiOrSerial: 'Av. Boa Viagem, 3210, Apto 501', accessories: '', reportedProblem: 'Sensor de movimento da sala disparando em falso.', status: ServiceOrderStatus.InProgress, creationDate: '2024-07-28', publicLink: 'https://example.com/os/view/sec002' },
    { id: 'OSS-003', customerName: 'Padaria Pão Quente', customerPhone: '(21) 2244-8899', customerEmail: 'contato@paoquente.com', deviceType: 'Cerca Elétrica', deviceBrand: 'Genno', deviceModel: 'Shock Premium', reportedProblem: 'Cerca não está energizada, central apitando erro.', status: ServiceOrderStatus.Pending, creationDate: '2024-07-30', publicLink: 'https://example.com/os/view/sec003' },
];

export const MOCK_SOLAR_ENERGY_SERVICE_ORDERS: ServiceOrder[] = [
    { id: 'OSSOL-001', customerName: 'Residência Família Souza', customerPhone: '(31) 98765-1122', customerEmail: 'familia.souza@email.com', deviceType: 'Sistema Fotovoltaico On-Grid', deviceBrand: 'WEG / Canadian', deviceModel: '5kWp', imeiOrSerial: 'Rua dos Girassóis, 450, Belo Horizonte', accessories: 'Telhado cerâmico, acesso fácil', reportedProblem: 'Instalação completa de sistema de 5kWp com 10 painéis solares e homologação na concessionária.', technicianNotes: 'Inversor instalado na área de serviço. Cabeamento passado por duto externo.', partsUsed: '10x Painel Solar Canadian 500W, 1x Inversor WEG 5kW, Estrutura de fixação, String Box', status: ServiceOrderStatus.Completed, creationDate: '2024-07-29', serviceCost: 3500, partsCost: 18500, totalValue: 22000.00, publicLink: 'https://example.com/os/view/sol001' },
    { id: 'OSSOL-002', customerName: 'Comércio Varejista ABC', customerPhone: '(11) 4545-9988', customerEmail: 'compras@varejoabc.com', deviceType: 'Manutenção Preventiva', deviceBrand: 'Fronius', deviceModel: 'Primo 10.0-1', imeiOrSerial: 'Av. Industrial, 1200, São Bernardo do Campo', accessories: '', reportedProblem: 'Inversor apresentando falha de comunicação com o portal e geração 20% abaixo do esperado.', status: ServiceOrderStatus.InProgress, creationDate: '2024-07-28', publicLink: 'https://example.com/os/view/sol002' },
    { id: 'OSSOL-003', customerName: 'Sítio Recanto Verde', customerPhone: '(19) 99333-4455', customerEmail: 'sitio.verde@email.com', deviceType: 'Limpeza de Painéis', deviceBrand: 'Diversas', deviceModel: '30 painéis', reportedProblem: 'Agendar limpeza anual dos painéis solares para otimizar a geração.', status: ServiceOrderStatus.Pending, creationDate: '2024-07-30', publicLink: 'https://example.com/os/view/sol003' },
];

export const MOCK_IT_CONSULTING_SERVICE_ORDERS: ServiceOrder[] = [
    { id: 'OSTI-001', customerName: 'Tech Solutions Ltda', customerPhone: '(31) 3333-4444', customerEmail: 'contato@techsolutions.com', deviceType: 'Manutenção de Servidor', deviceBrand: 'Windows Server', deviceModel: 'Servidor Dell PowerEdge R740', imeiOrSerial: 'Contrato MENSAL-001', accessories: 'Acesso remoto via AnyDesk fornecido', reportedProblem: 'Verificação mensal do servidor, aplicação de atualizações de segurança e checagem de logs de eventos.', technicianNotes: 'Windows Server atualizado. Logs sem eventos críticos. Performance estável.', partsUsed: 'N/A', status: ServiceOrderStatus.Completed, creationDate: '2024-07-29', serviceCost: 450, partsCost: 0, totalValue: 450.00, publicLink: 'https://example.com/os/view/ti001' },
    { id: 'OSTI-002', customerName: 'Escritório de Advocacia Central', customerPhone: '(21) 2255-7788', customerEmail: 'ti@advcentral.com', deviceType: 'Suporte Técnico Remoto', deviceBrand: 'Office 365', deviceModel: 'Estação de Trabalho Dell', imeiOrSerial: 'CHAMADO-9876', accessories: '', reportedProblem: 'Usuário não consegue sincronizar arquivos do OneDrive na estação de trabalho nova.', status: ServiceOrderStatus.InProgress, creationDate: '2024-07-28', publicLink: 'https://example.com/os/view/ti002' },
    { id: 'OSTI-003', customerName: 'Clínica Médica Bem Viver', customerPhone: '(11) 5050-6060', customerEmail: 'adm@clinicabemviver.com', deviceType: 'Gestão de Rede', deviceBrand: 'Ubiquiti UniFi', deviceModel: 'Switch US-48-500W', reportedProblem: 'Ponto de rede na recepção 2 não está funcionando. Possível problema no cabo ou na porta do switch.', status: ServiceOrderStatus.Pending, creationDate: '2024-07-30', publicLink: 'https://example.com/os/view/ti003' },
];


export const SALES_DATA = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Fev', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Abr', revenue: 4500 },
    { name: 'Mai', revenue: 6000 },
    { name: 'Jun', revenue: 5500 },
    { name: 'Jul', revenue: 7000 },
];

export const CATEGORY_DATA = [
    { name: 'Eletrônicos', value: 400 },
    { name: 'Periféricos', value: 300 },
    { name: 'Monitores', value: 200 },
    { name: 'Móveis', value: 100 },
];