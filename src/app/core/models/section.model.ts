export interface Section {
  id: string;
  branch_id: number | string;
  name: string;
  code: string;
  grade_level: string | null;
  grade_label?: string | null;  // Display label for grade (e.g., "Grade 5")
  grade_details?: {  // Full grade information
    value: string;
    label: string;
    description?: string | null;
    is_active: boolean;
  } | null;
  capacity: number;
  current_strength: number;
  room_number: string | null;
  class_teacher_id: number | string | null;
  description: string | null;
  is_active: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  classTeacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  class?: {  // Associated class information
    id: string;
    grade: string;
    section: string;
    class_name: string;
    academic_year: string;
  } | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SectionFormData {
  branch_id: number | string;
  name: string;
  code: string;
  grade_level?: string | null;
  capacity: number;
  room_number?: string | null;
  class_teacher_id?: number | string | null;
  description?: string | null;
  is_active?: boolean;
}

