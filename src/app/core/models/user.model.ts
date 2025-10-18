export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  role?: string;
  role_id?: number;
  branch_id?: number;
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
  role_id: number;
  branch_id?: number;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  password_confirmation?: string;
  role_id?: number;
  branch_id?: number;
  is_active?: boolean;
}

