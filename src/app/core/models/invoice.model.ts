export interface Invoice {
  id: number;
  invoice_number: string;
  branch_id: number;
  student_id?: number | null;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  invoice_type: string;
  subtotal: number;
  tax_amount: number;
  tax_percentage: number;
  discount_amount: number;
  discount_percentage: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  payment_method?: string;
  payment_reference?: string;
  payment_date?: string;
  notes?: string;
  terms_conditions?: string;
  academic_year: string;
  created_by?: number;
  sent_at?: string;
  is_overdue?: boolean;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  createdBy?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  items?: InvoiceItem[];
  transactions?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  transaction_id?: number | null;
  item_type?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_amount?: number;
  discount_amount?: number;
  amount: number;
}

export interface InvoiceFormData {
  branch_id: number;
  student_id?: number | null;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  invoice_type: string;
  items: InvoiceItem[];
  tax_percentage?: number;
  discount_percentage?: number;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  terms_conditions?: string;
}

export interface TransactionSearchParams {
  branch_id?: number;
  party_name?: string;
  category_id?: number;
  from_date?: string;
  to_date?: string;
}

export interface GenerateInvoiceRequest {
  transaction_ids: number[];
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  invoice_type?: string;
  tax_percentage?: number;
  discount_percentage?: number;
  notes?: string;
  terms_conditions?: string;
}

export interface PaymentData {
  amount: number;
  payment_method: string;
  payment_date: string;
  payment_reference?: string;
}

export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_invoices: number;
  draft_invoices: number;
  paid_invoices: number;
  partial_invoices: number;
}

