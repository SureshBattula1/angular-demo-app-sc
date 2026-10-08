import { Book, BorrowerType } from './book.model';

export * from './book.model';

export interface LibraryCategory {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  name: string;
  code?: string | null;
  parent_id?: string | number | null;
  parent?: LibraryCategory | null;
  description?: string | null;
  books_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LibraryAuthor {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  name: string;
  biography?: string | null;
  nationality?: string | null;
  born_year?: number | null;
  website?: string | null;
  books_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LibraryPublisher {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  books_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LibrarySubject {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  name: string;
  code?: string | null;
  description?: string | null;
  books_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CopyCondition = 'New' | 'Good' | 'Fair' | 'Damaged' | 'Lost' | 'Weeded';
export type CopyStatus = 'Available' | 'Issued' | 'Reserved' | 'Maintenance' | 'Lost' | 'Weeded';

export interface LibraryBookCopy {
  id: string | number;
  book_id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  accession_number: string;
  barcode: string;
  copy_number: number;
  shelf_id?: string | number | null;
  condition: CopyCondition;
  status: CopyStatus;
  purchase_price?: number | null;
  purchase_date?: string | null;
  vendor_name?: string | null;
  remarks?: string | null;
  is_active: boolean;
  book?: Book;
  shelf?: LibraryShelf | null;
  created_at?: string;
  updated_at?: string;
}

export interface LibraryShelf {
  id: string | number;
  branch_id: string | number;
  school_id?: string | number | null;
  floor?: string | null;
  room?: string | null;
  rack_number: string;
  shelf_number?: string | null;
  code?: string | null;
  shelf_code?: string | null;
  capacity: number;
  category_id?: string | number | null;
  category?: LibraryCategory | null;
  copies_count?: number;
  current_books_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LibraryStockVerification {
  id: string | number;
  branch_id: string | number;
  session_title: string;
  verified_by?: string | number;
  verifier?: { id: string | number; first_name: string; last_name: string; email: string };
  started_at: string;
  completed_at?: string | null;
  status: 'In Progress' | 'Completed' | 'Cancelled';
  total_copies_checked: number;
  missing_count: number;
  notes?: string | null;
  items_count?: number;
  created_at?: string;
}

export interface LibraryMember {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  user_type?: string;
  branch_id: string | number;
  is_active: boolean;
  active_loans_count: number;
  overdue_loans_count: number;
  pending_fines: number;
}

export type ReservationStatus = 'Pending' | 'Ready for Pickup' | 'Fulfilled' | 'Cancelled' | 'Expired';

export interface LibraryReservation {
  id: string | number;
  book_id: string | number;
  copy_id?: string | number | null;
  member_id: string | number;
  borrower_type: BorrowerType;
  reserved_at: string;
  hold_until?: string | null;
  status: ReservationStatus;
  notified_at?: string | null;
  notes?: string | null;
  book?: Book;
  copy?: LibraryBookCopy | null;
  member?: { id: string | number; first_name: string; last_name: string; email: string; role: string };
}

export type FineStatus = 'Pending' | 'Paid' | 'Partially Paid' | 'Waived';
export type FineType = 'Late Return' | 'Lost Book' | 'Damaged Book' | 'Other';

export interface LibraryFine {
  id: string | number;
  book_issue_id?: string | number | null;
  member_id: string | number;
  borrower_type: BorrowerType;
  type: FineType;
  amount: number;
  paid_amount: number;
  waived_amount: number;
  status: FineStatus;
  payment_method?: string | null;
  transaction_reference?: string | null;
  waived_reason?: string | null;
  collected_by?: string | number | null;
  paid_at?: string | null;
  member?: { id: string | number; first_name: string; last_name: string; email: string; role: string };
  collector?: { id: string | number; first_name: string; last_name: string };
  issue?: { id: string | number; book?: Book };
  created_at?: string;
}

export interface LibraryProcurementItem {
  id?: string | number;
  procurement_id?: string | number;
  book_id?: string | number | null;
  title: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  accession_status: 'Pending' | 'Generated';
}

export interface LibraryProcurement {
  id: string | number;
  branch_id: string | number;
  po_number: string;
  vendor_name: string;
  vendor_contact?: string | null;
  order_date: string;
  delivery_date?: string | null;
  total_amount: number;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  invoice_number?: string | null;
  created_by?: string | number | null;
  creator?: { id: string | number; first_name: string; last_name: string };
  remarks?: string | null;
  items?: LibraryProcurementItem[];
  items_count?: number;
  created_at?: string;
}

export interface LibraryDashboardSummary {
  total_titles: number;
  total_copies: number;
  issued_copies: number;
  available_copies: number;
  overdue_copies: number;
  active_members: number;
  pending_fines: number;
  collected_fines: number;
}

export interface CirculationTrend {
  year: number;
  month: number;
  label: string;
  issues: number;
  returns: number;
}
