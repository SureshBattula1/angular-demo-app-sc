export interface Department {
  id: string;
  name: string;
  head: string;
  head_id: number | string | null;
  description: string | null;
  established_date: string;
  branch_id: number | string;
  students_count: number;
  teachers_count: number;
  is_active: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  headOfDepartment?: {
    id: string;
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
  head_id?: number | string | null;
  established_date: string;
  branch_id: number | string;
  description?: string | null;
  students_count?: number;
  teachers_count?: number;
  is_active?: boolean;
}


