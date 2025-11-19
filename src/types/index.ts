// Chicken Management Types
export interface Chicken {
  id: string;
  batch_number: string;
  breed: string;
  count: number;
  age_weeks: number;
  purchase_date: string;
  purchase_price: number;
  status: 'alive' | 'sick' | 'dead';
  current_stock?: number; // الإنتاج المتواجد حالياً
  notes?: string;
  created_at?: string;
}

export interface HealthEvent {
  id: string;
  chicken_id: string;
  event_type: 'vaccination' | 'treatment' | 'checkup' | 'death' | 'illness' | 'recovery';
  date: string;
  description: string;
  medication?: string;
  dosage?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
}

// Egg Production Types
export interface EggProduction {
  id: string;
  date: string;
  batch_number: string; // رقم الدفعة
  total_eggs: number;
  damaged_eggs: number;
  good_eggs: number;
  collection_time: string;
  notes?: string;
}

// Sales Management Types
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tax_id?: string;
  commercial_register?: string; // رقم السجل التجاري
  city?: string; // المدينة
  postal_code?: string; // الرمز البريدي
  notes?: string;
  created_at?: string;
}

export interface SaleItem {
  id: string;
  product_type: 'eggs' | 'chicken' | 'carton';
  batch_number?: string; // رقم الدفعة (للبيض فقط)
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
}

export interface Sale {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  sale_date: string;
  items: SaleItem[];
  total_amount: number;
  payment_status: 'paid' | 'pending';
  payment_method?: 'cash' | 'transfer' | 'check';
  invoice_number: string;
  notes?: string;
}

// Expense Management Types
export interface Expense {
  id: string;
  date: string;
  category: 'feed' | 'medicine' | 'water' | 'electricity' | 'supplies' | 'maintenance' | 'other' | 'paid';
  description: string;
  amount: number;
  beneficiary?: string;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  notes?: string;
}

// Carton Management Types
export interface Carton {
  id: string;
  type: string; // '15', '15.5', '16', '17', 'مصري', 'جزائري'
  capacity: number;
  available_quantity: number;
  purchase_price: number;
  supplier?: string;
  purchase_date?: string;
}

// Carton Movement Types
export interface CartonMovement {
  id: string;
  carton_id: string;
  movement_type: 'in' | 'out' | 'used';
  quantity: number;
  date: string;
  reference?: string;
  notes?: string;
}

// Vaccination Types
export interface Vaccination {
  id: string;
  chicken_batch_id: string;
  vaccine_name: string;
  date: string;
  dosage: string;
  veterinarian?: string;
  cost?: number;
  next_vaccination_date?: string;
  notes?: string;
}

// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee' | 'viewer';
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: UserPermission[];
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface UserPermission {
  id: string;
  module: 'chickens' | 'eggs' | 'sales' | 'expenses' | 'cartons' | 'users';
  actions: ('read' | 'create' | 'update' | 'delete')[];
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
  ip_address?: string;
}

// Dashboard Statistics
export interface DashboardStats {
  totalChickens: number;
  aliveChickens: number;
  sickChickens: number;
  deadChickens: number;
  todayEggs: number;
  weeklyEggs: number;
  monthlyEggs: number;
  damageRate: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  lowStockCartons: Carton[];
}

// Authentication Types
export interface AuthState {
  user: User | null;
  loading: boolean;
}