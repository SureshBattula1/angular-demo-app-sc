export interface Department {
  id: number;
  name: string;
  head: string;
  head_id: number | null;
  description: string | null;
  established_date: string;
  branch_id: number;
  students_count: number;
  teachers_count: number;
  is_active: boolean;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  headOfDepartment?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  subjects?: any[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DepartmentFormData {
  name: string;
  head: string;
  head_id?: number | null;
  established_date: string;
  branch_id: number;
  description?: string | null;
  students_count?: number;
  teachers_count?: number;
  is_active?: boolean;
}

