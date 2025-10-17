export interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  user_type: string;
  branch_id: number;
  is_active: boolean;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface TeacherFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password?: string;
  branch_id: number;
  is_active?: boolean;
}

