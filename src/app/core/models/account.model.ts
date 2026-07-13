export interface AccountCategory {
  id: string;
  branch_id?: number | string | null;
  academic_year_id?: number | string | null;
  name: string;
  code: string;
  type: 'Income' | 'Expense';
  sub_type?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relationships
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  /** Laravel API may return snake_case */
  academic_year?: {
    id: string;
    name: string;
  };
  transactions?: Transaction[];
  budgets?: Budget[];
}

export interface AccountCategoryFormData {
  branch_id?: number | string | null;
  academic_year_id?: number | string | null;
  name: string;
  code: string;
  type: 'Income' | 'Expense';
  sub_type?: string;
  description?: string;
  is_active?: boolean;
}

export interface Transaction {
  id: string;
  branch_id: number | string;
  category_id: number | string;
  transaction_number: string;
  transaction_date: string;
  type: 'Income' | 'Expense';
  amount: number;
  party_name?: string;
  party_type?: string;
  party_id?: number | string;
  payment_method: 'Cash' | 'Check' | 'Card' | 'Bank Transfer' | 'UPI' | 'Other';
  payment_reference?: string;
  bank_name?: string;
  description: string;
  notes?: string;
  attachments?: string[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  created_by: number | string;
  approved_by?: number | string;
  approved_at?: string;
  financial_year: string;
  month: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Relationships
  category?: AccountCategory;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  createdBy?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  salaryPayment?: SalaryPayment;
}

export interface SalaryPayment {
  id: string;
  transaction_id: number | string;
  employee_id: number | string;
  employee_type: 'Teacher' | 'Staff';
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  salary_month: string;
  salary_year: string;
  remarks?: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface Budget {
  id: string;
  branch_id: number | string;
  category_id: number | string;
  financial_year: string;
  allocated_amount: number;
  utilized_amount: number;
  remaining_amount: number;
  notes?: string;
  is_active: boolean;
  category?: AccountCategory;
}

export interface AccountDashboard {
  summary: {
    total_income: number;
    total_expense: number;
    net_balance: number;
    financial_year: string;
    category_count?: number;
  };
  income_by_category: Array<{
    category: string;
    amount: number;
  }>;
  expense_by_category: Array<{
    category: string;
    amount: number;
  }>;
  recent_transactions: Transaction[];
  monthly_trend: Array<{
    month: number;
    year: number;
    type: string;
    total: number;
  }>;
}

export interface TransactionFormData {
  branch_id: number | string;
  category_id: number | string;
  transaction_date: string;
  type: 'Income' | 'Expense';
  amount: number;
  party_name?: string;
  party_type?: string;
  party_id?: number | string;
  payment_method: string;
  payment_reference?: string;
  bank_name?: string;
  description: string;
  notes?: string;
  is_salary?: boolean;
  salary_details?: {
    employee_id: number | string;
    employee_type: string;
    basic_salary: number;
    allowances?: number;
    deductions?: number;
    net_salary: number;
    salary_month: string;
    salary_year: string;
    remarks?: string;
  };
}

