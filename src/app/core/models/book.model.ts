/** Library book (copy-counts model). IDs are opaque hashids — never Number() them. */
export interface Book {
  id: string | number;
  title: string;
  author: string;
  isbn?: string | null;
  category?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  language?: string | null;
  edition?: string | null;
  pages?: number | null;
  branch_id: string | number;
  school_id?: string | number | null;
  total_copies: number;
  available_copies: number;
  location?: string | null;
  description?: string | null;
  is_active?: boolean;
  branch?: { id: string | number | null; name: string | null; code: string | null };
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
