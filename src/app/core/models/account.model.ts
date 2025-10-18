export interface AccountCategory {
  id: number;
  name: string;
  code: string;
  type: 'Income' | 'Expense';
  sub_type?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  branch_id: number;
  category_id: number;
  transaction_number: string;
  transaction_date: string;
  type: 'Income' | 'Expense';
  amount: number;
  party_name?: string;
  party_type?: string;
  party_id?: number;
  payment_method: 'Cash' | 'Check' | 'Card' | 'Bank Transfer' | 'UPI' | 'Other';
  payment_reference?: string;
  bank_name?: string;
  description: string;
  notes?: string;
  attachments?: string[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  financial_year: string;
  month: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Relationships
  category?: AccountCategory;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  createdBy?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  salaryPayment?: SalaryPayment;
}

export interface SalaryPayment {
  id: number;
  transaction_id: number;
  employee_id: number;
  employee_type: 'Teacher' | 'Staff';
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  salary_month: string;
  salary_year: string;
  remarks?: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface Budget {
  id: number;
  branch_id: number;
  category_id: number;
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
  branch_id: number;
  category_id: number;
  transaction_date: string;
  type: 'Income' | 'Expense';
  amount: number;
  party_name?: string;
  party_type?: string;
  party_id?: number;
  payment_method: string;
  payment_reference?: string;
  bank_name?: string;
  description: string;
  notes?: string;
  is_salary?: boolean;
  salary_details?: {
    employee_id: number;
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

