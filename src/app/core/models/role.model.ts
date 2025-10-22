export interface Role {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  level?: number;
  is_system_role?: boolean;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  slug?: string;
  display_name?: string;
  description?: string;
  module?: string;
  action?: string;
  is_system_permission?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

