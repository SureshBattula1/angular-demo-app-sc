export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  department_id: number | string;
  teacher_id: number | string | null;
  grade_level: string;
  grade_label?: string;
  credits: number;
  type: 'Core' | 'Elective' | 'Language' | 'Lab' | 'Activity';
  branch_id: number | string;
  is_active: boolean;
  status_label?: string;
  department?: {
    id: string;
    name: string;
    head: string;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  exams?: any[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SubjectFormData {
  name: string;
  code: string;
  department_id: number | string;
  grade_level: string;
  type: string;
  branch_id: number | string;
  teacher_id?: number | string | null;
  credits?: number;
  description?: string | null;
  is_active?: boolean;
}


