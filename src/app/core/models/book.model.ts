/** Library book (copy-counts model). IDs are opaque hashids — never Number() them. */
export interface Book {
  id: string | number;
  title: string;
  author: string;
  author_id?: string | number | null;
  isbn?: string | null;
  category?: string | null;
  category_id?: string | number | null;
  publisher?: string | null;
  publisher_id?: string | number | null;
  shelf_id?: string | number | null;
  published_year?: number | null;
  language?: string | null;
  edition?: string | null;
  ddc_code?: string | null;
  call_number?: string | null;
  pages?: number | null;
  branch_id: string | number;
  school_id?: string | number | null;
  total_copies: number;
  available_copies: number;
  location?: string | null;
  description?: string | null;
  is_active?: boolean;
  subject_ids?: (string | number)[];
  subjects?: { id: string | number; name: string; code?: string | null }[];
  category_master?: { id: string | number; name: string; code?: string | null };
  author_master?: { id: string | number; name: string };
  publisher_master?: { id: string | number; name: string };
  branch?: { id: string | number | null; name: string | null; code: string | null };
  copies?: {
    id: string | number;
    barcode?: string;
    accession_number?: string;
    copy_number: number;
    shelf_id?: string | number | null;
    condition?: string;
    status?: string;
    purchase_price?: number | null;
    shelf?: unknown;
  }[];
  created_at?: string;
  updated_at?: string;
}

export type BorrowerType = 'Student' | 'Teacher';
export type IssueStatus = 'Issued' | 'Returned' | 'Overdue' | 'Lost';

/** A book loan. List endpoints add the joined *_title / member_* display fields. */
export interface BookIssue {
  id: string | number;
  book_id: string | number;
  branch_id: string | number;
  borrower_type: BorrowerType;
  student_id?: string | number | null;
  teacher_id?: string | number | null;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  status: IssueStatus;
  fine_amount?: number;
  fine_paid?: boolean;
  remarks?: string | null;
  book_title?: string;
  book_author?: string;
  branch_name?: string;
  member_name?: string;
  member_email?: string;
  book?: Book;
}
