export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface CustomerFollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdAt: string;
  createdByUser?: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: {
    challans: number;
    followUpNotes: number;
  };
  followUpNotes?: CustomerFollowUpNote[];
  challans?: SalesChallan[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovementLog {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    location: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SalesChallanItem {
  id: string;
  challanId: string;
  productId?: string | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
  product?: Product;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer: Customer;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    name: string;
    role: UserRole;
  };
  items: SalesChallanItem[];
}

export interface DashboardStats {
  metrics: {
    totalRevenue: number;
    totalCustomers: number;
    activeCustomers: number;
    leadCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    totalChallans: number;
    confirmedChallansCount: number;
    draftChallansCount: number;
  };
  lowStockAlerts: Product[];
  recentChallans: SalesChallan[];
  recentMovements: StockMovementLog[];
}
