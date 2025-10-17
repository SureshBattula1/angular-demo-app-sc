export interface Grade {
  value: string;
  label: string;
  description?: string;
  students_count?: number;
  sections?: string[];
  classes_count?: number;
  is_active?: boolean;
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
}

export interface GradeOption {
  value: string;
  label: string;
}

export interface GradeFormData {
  value: string;
  label: string;
  description?: string;
  is_active?: boolean;
}

