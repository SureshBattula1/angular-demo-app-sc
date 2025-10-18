export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  module?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

