
export type Page = 'dashboard' | 'pdv' | 'products' | 'customers' | 'invoices' | 'invoice-issuing' | 'companies' | 'accounts-payable' | 'accounts-receivable' | 'service-orders' | 'electronics-service-orders' | 'automotive-service-orders' | 'security-service-orders' | 'solar-energy-service-orders' | 'it-consulting-service-orders' | 'settings' | 'shopee-calc' | 'return-labels' | 'user-management' | 'coupon-management' | 'reports' | 'digital-certificate' | 'collection-point';

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock: number;
  category: string;
  sku: string;
  brand?: string;
  supplier?: string;
  ncm?: string;
  cest?: string;
  unit?: 'UN' | 'KG' | 'PC' | 'CX';
  weight?: number; // in kg
  dimensions?: {
    length: number; // in cm
    width: number;
    height: number;
  };
  imageUrls?: string[];
  icmsRate?: number; // %
  pisRate?: number; // %
  cofinsRate?: number; // %
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF/CNPJ
  address?: string;
}

export interface Company {
  id: string;
  name: string;
  legalName: string;
  document: string; // CNPJ
  address: string;
  stateRegistration?: string; // Inscrição Estadual
  hasCertificate?: boolean;
  certificateExpires?: string;
}

export enum InvoiceStatus {
  Issued = 'Emitida',
  Pending = 'Pendente',
  Canceled = 'Cancelada',
}

export interface InvoiceItem {
  id: number;
  code: string;
  description: string;
  ncm: string;
  csosn: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id:string;
  customer: Customer;
  issuer: Company;
  issueDate: string;
  exitDate: string;
  series: string;
  accessKey: string;
  protocol: string;
  items: InvoiceItem[];
  totalProducts: number;
  totalInvoice: number;
  status: InvoiceStatus;
  type: 'NFe' | 'NFCe' | 'NFSe-MEI';
  taxInfo: {
    baseICMS: number;
    valueICMS: number;
    baseST: number;
    valueST: number;
    valueFrete: number;
    valueSeguro: number;
    outrasDespesas: number;
    valueIPI: number;
    valuePIS: number;
    valueCOFINS: number;
  };
}


export interface AccountTransaction {
  id: string;
  description: string;
  category: string;
  dueDate: string;
  paymentDate?: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export enum ServiceOrderStatus {
  Pending = 'Aguardando Avaliação',
  InProgress = 'Em Andamento',
  WaitingParts = 'Aguardando Peças',
  Completed = 'Concluído',
  Canceled = 'Cancelado',
}

export interface DamageMarker {
  x: number; // percentage
  y: number; // percentage
  description: string;
}

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceType: string; // Can be 'Notebook', 'TV', 'Carro'
  deviceBrand: string;
  deviceModel: string;
  vehiclePlate?: string; // Placa do veículo
  imeiOrSerial?: string; // IMEI, Nº de Série ou Chassi
  accessories?: string;
  reportedProblem: string;
  technicianNotes?: string;
  partsUsed?: string;
  media?: { type: 'image' | 'video'; url: string; }[];
  status: ServiceOrderStatus;
  creationDate: string;
  serviceCost?: number;
  partsCost?: number;
  totalValue?: number;
  publicLink?: string;
  year?: string; // Ano do veículo
  dataConclusao?: string;
  warrantyMonths?: number;
  estimatedDeliveryDate?: string;
  damageMarkers?: DamageMarker[];
}

export interface AppSettings {
  showMobileRepair: boolean;
  showElectronicsRepair: boolean;
  showAutomotiveRepair: boolean;
  showInvoiceIssuing: boolean;
  showSecuritySystems: boolean;
  showSolarEnergy: boolean;
  showITConsulting: boolean;
  showReturnLabels: boolean;
  showCollectionPoint: boolean;
  showShopeeCalc: boolean;
}

export interface UserPermissions {
  dashboard: boolean;
  pdv: boolean;
  invoiceIssuing: boolean;
  invoices: boolean;
  serviceOrders: boolean;
  electronicsServiceOrders: boolean;
  automotiveServiceOrders: boolean;
  securityServiceOrders: boolean;
  solarEnergyServiceOrders: boolean;
  itConsultingServiceOrders: boolean;
  products: boolean;
  customers: boolean;
  companies: boolean;
  digitalCertificate: boolean;
  accountsPayable: boolean;
  accountsReceivable: boolean;
  shopeeCalc: boolean;
  returnLabels: boolean;
  collectionPoint: boolean;
  settings: boolean;
  userManagement: boolean;
  couponManagement: boolean;
  reports: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string; // CPF/CNPJ
  address?: string;
  role: 'Admin' | 'Operador';
  permissions: UserPermissions;
  companyId?: string;
}

export interface ReceiptData {
  id: string;
  date: string;
  company: Company;
  items: {
    quantity: number;
    name: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod?: string;
  installments?: number;
  amountReceived?: number;
  change?: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number; // e.g., 0.30 for 30%
  status: 'active' | 'paused';
  usageLimit: number; // total number of times it can be used
  usedCount: number;
  usageHistory: {
    customerName: string;
    document: string;
    usedAt: string;
  }[];
}

export interface LabelStockEntry {
  id: string;
  date: string;
  quantity: number;
  totalCost: number;
  unitCost: number; // derived for display
  description?: string; // e.g., Supplier name or Batch ID
}

export interface ReturnEntry {
  id: string;
  date: string;
  quantity: number;
}

export interface CollectionPointItem {
  id: string;
  name: string;
  type: 'packaging' | 'tape' | 'label' | 'other';
  size?: string;
  price: number; // Sale price
  cost: number; // Internal cost
  stock: number;
}

export interface CollectionTransaction {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  type: 'sale' | 'internal_use';
  quantity: number;
  unitValue: number; // Price for sale, Cost for usage
  totalValue: number;
}