export interface Leave {
  id: string;
  student_id?: string;
  teacher_id?: string;
  branch_id?: string;
  academic_year_id?: number | string;
  academic_year_name?: string;
  from_date: string;
  to_date: string;
  total_days: number;
  leave_type: LeaveType;
  status: LeaveStatus;
  reason: string;
  remarks?: string;
  attachment?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  substitute_teacher_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Additional fields from joins
  first_name?: string;
  last_name?: string;
  full_name?: string; // Computed field: first_name + last_name
  email?: string;
  mobile_number?: string;
  admission_number?: string;
  employee_id?: string;
  grade?: string;
  grade_label?: string;
  section?: string;
  designation?: string;
  branch_name?: string; // Branch name from join
  leave_for?: 'student' | 'teacher';
  /** Resolved path or URL for applicant profile photo (leave detail API) */
  profile_picture?: string | null;
}

export interface StudentLeave extends Leave {
  student_id: string;
  admission_number?: string;
  grade?: string;
  grade_label?: string;
  section?: string;
}

export interface TeacherLeave extends Leave {
  teacher_id: string;
  employee_id?: string;
  designation?: string;
  substitute_teacher_id?: string;
}

export type LeaveType = 
  | 'Sick Leave'
  | 'Casual Leave'
  | 'Medical Leave'
  | 'Family Emergency'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Compensatory Leave'
  | 'Unpaid Leave'
  | 'Other';

export type LeaveStatus = 
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export interface LeaveSummary {
  total_leaves: number;
  total_days_taken: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface LeaveResponse {
  success: boolean;
  message?: string;
  data?: Leave | Leave[];
  summary?: LeaveSummary;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    has_more_pages: boolean;
  };
  error?: string;
  errors?: Record<string, string[]>;
}

