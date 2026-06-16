export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  role?: string;
  role_id?: number | string;
  branch_id?: number | string;
  branch?: any;
  permissions?: string[];
  is_active?: boolean;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  password: string;
  password_confirmation: string;
  role_id: number | string;
  branch_id?: number | string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  password_confirmation?: string;
  role_id?: number | string;
  branch_id?: number | string;
  is_active?: boolean;
}

