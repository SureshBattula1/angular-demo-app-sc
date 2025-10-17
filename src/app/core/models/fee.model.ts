export interface FeeStructure {
  id?: string | number;
  branch_id: string | number;
  grade: string;
  fee_type: 'Tuition' | 'Library' | 'Laboratory' | 'Sports' | 'Transport' | 'Exam' | 'Other';
  amount: number;
  academic_year: string;
  due_date?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_period?: 'Monthly' | 'Quarterly' | 'Annually';
  is_active?: boolean;
  created_by?: string | number;
  updated_by?: string | number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  // Relationships
  branch?: any;
  creator?: any;
  updater?: any;
  payments?: FeePayment[];
}

export interface FeePayment {
  id?: string | number;
  fee_structure_id: string | number;
  student_id: string | number;
  amount_paid: number;
  payment_date: string;
  payment_method: 'Cash' | 'Card' | 'Online' | 'Cheque' | 'Other';
  transaction_id?: string;
  receipt_number?: string;
  discount_amount?: number;
  late_fee?: number;
  total_amount?: number;
  payment_status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  remarks?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  fee_structure?: FeeStructure;
  student?: any;
  creator?: any;
}

export interface StudentFees {
  payments: FeePayment[];
  pending_fees: FeeStructure[];
  total_paid: number;
  pending_count: number;
}

export interface FeeFilters {
  branch_id?: string;
  grade?: string;
  fee_type?: string;
  academic_year?: string;
  student_id?: string;
  payment_status?: string;
  payment_method?: string;
  from_date?: string;
  to_date?: string;
  per_page?: number;
  page?: number;
}

export interface FeeStatistics {
  total_collected: number;
  pending_amount: number;
  total_students: number;
  paid_students: number;
  pending_students: number;
  collection_percentage: number;
}

