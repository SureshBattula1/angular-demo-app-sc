export interface GradeClassTeacher {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  employee_id?: string | null;
}

export interface GradeSectionSummary {
  id?: number | null;
  name: string;
  code?: string | null;
  capacity?: number;
  room_number?: string | null;
  is_active?: boolean;
  students: {
    male: number;
    female: number;
    other: number;
    total: number;
  };
  class_teacher?: GradeClassTeacher | null;
}

export interface Grade {
  value: string;
  label: string;
  description?: string;
  order?: number;
  category?: 'Pre-Primary' | 'Primary' | 'Middle' | 'Secondary' | 'Senior-Secondary';
  students_count?: number;
  sections?: string[];
  sections_summary?: GradeSectionSummary[];
  classes_count?: number;
  branch_id?: number | string | null;
  branch_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GradeStats {
  total_students: number;
  total_sections: number;
  total_teachers: number;
  average_attendance: number;
  pass_percentage: number;
}

export interface GradeListResponse {
  success: boolean;
  data: Grade[];
  count?: number;
  total?: number;
  message?: string;
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    has_more_pages?: boolean;
  };
}

export interface GradeOption {
  value: string;
  label: string;
}

export interface GradeFormData {
  value: string;
  label: string;
  description?: string;
  order?: number;
  category?: 'Pre-Primary' | 'Primary' | 'Middle' | 'Secondary' | 'Senior-Secondary';
  is_active?: boolean;
}

