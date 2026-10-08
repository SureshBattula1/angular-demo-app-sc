export interface FeeStructure {
  id?: string;
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
  id?: string;
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
  payment_status: 'Pending' | 'Partial' | 'Completed' | 'Failed' | 'Refunded';
  remarks?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  fee_structure?: FeeStructure;
  student?: any;
  creator?: any;
  /** Grade display name from API (e.g. "International Grade 10") */
  student_grade_label?: string;
  /** Section name from API (e.g. "A") */
  student_section?: string;
  past_transactions?: Array<{
    id: string;
    receipt_number?: string;
    payment_date: string;
    payment_method?: string;
    amount_paid: number;
    discount_amount?: number;
    late_fee?: number;
    total_amount?: number;
    payment_status?: string;
  }>;
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
  academic_year_id?: number | string;
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

export interface FeeType {
  id?: string;
  name: string;
  code: string;
  description?: string;
  branch_id: string | number;
  academic_year_id?: number | string;
  academicYear?: { name?: string } | null;
  academic_year?: { name?: string } | null;
  is_mandatory: boolean;
  is_refundable: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Relationships
  branch?: any;
  fee_structures?: FeeStructure[];
}

export interface FeeTypeFormData {
  name: string;
  code: string;
  description?: string;
  branch_id: string | number;
  academic_year_id: number | string;
  is_mandatory?: boolean;
  is_refundable?: boolean;
  is_active?: boolean;
}

