export interface Section {
  id: number;
  branch_id: number;
  name: string;
  code: string;
  grade_level: string | null;
  capacity: number;
  current_strength: number;
  room_number: string | null;
  class_teacher_id: number | null;
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
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SectionFormData {
  branch_id: number;
  name: string;
  code: string;
  grade_level?: string | null;
  capacity: number;
  room_number?: string | null;
  class_teacher_id?: number | null;
  description?: string | null;
  is_active?: boolean;
}

