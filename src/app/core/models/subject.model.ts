export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string | null;
  department_id: number;
  teacher_id: number | null;
  grade_level: string;
  credits: number;
  type: 'Core' | 'Elective' | 'Language' | 'Lab' | 'Activity';
  branch_id: number;
  is_active: boolean;
  department?: {
    id: number;
    name: string;
    head: string;
  };
  teacher?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  branch?: {
    id: number;
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
  department_id: number;
  grade_level: string;
  type: string;
  branch_id: number;
  teacher_id?: number | null;
  credits?: number;
  description?: string | null;
  is_active?: boolean;
}

