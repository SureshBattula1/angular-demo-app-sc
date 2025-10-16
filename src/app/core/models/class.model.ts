export interface Class {
  id: number;
  branch_id: number;
  grade: string;
  section: string | null;
  class_name: string;
  academic_year: string;
  class_teacher_id: number | null;
  capacity: number;
  current_strength: number;
  room_number: string | null;
  description: string | null;
  is_active: boolean;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  classTeacher?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  students?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface ClassFormData {
  branch_id: number;
  grade: string;
  section: string | null;
  academic_year: string;
  class_teacher_id?: number | null;
  capacity: number;
  room_number?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface GradeOption {
  value: string;
  label: string;
}

export interface SectionOption {
  value: string;
  label: string;
}

