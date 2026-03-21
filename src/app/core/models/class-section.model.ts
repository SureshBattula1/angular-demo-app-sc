export interface ClassSection {
  grade: string;
  section: string | null;
  branch_id: number;
  academic_year: string;
  student_count: number;
  class_name: string;
}

export interface Grade {
  grade: string;
  count: number;
}

export interface Section {
  section: string;
  count: number;
}

export interface StudentGroup {
  id: number;
  branch_id: number;
  name: string;
  code: string;
  type: 'Academic' | 'Sports' | 'Cultural' | 'Club';
  academic_year: string;
  academic_year_id?: number | null;
  description?: string;
  is_active: boolean;
  member_count?: number;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  members?: GroupMember[];
  created_at?: string;
  updated_at?: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  student_id: number;
  joined_date: string;
  role: 'Member' | 'Leader';
  is_active: boolean;
  grade?: string;
  section?: string;
  grade_label?: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    grade?: string;
    section?: string;
    grade_label?: string;
  };
  student_record?: {
    grade?: string;
    section?: string;
    grade_label?: string;
  };
}

export interface GroupFormData {
  branch_id: number;
  name: string;
  code: string;
  type: string;
  academic_year?: string;
  academic_year_id?: number;
  description?: string;
  is_active?: boolean;
}

export interface ClassListResponse {
  success: boolean;
  data: ClassSection[];
  count: number;
}

export interface GroupListResponse {
  success: boolean;
  data: StudentGroup[];
  count: number;
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

