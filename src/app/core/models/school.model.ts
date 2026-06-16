export interface School {
  id: string;
  company_id: number | string;
  name: string;
  code: string;
  main_branch_id?: number | string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'UnderConstruction';
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Relationships
  company?: {
    id: string;
    name: string;
    code: string;
  };
  main_branch?: {
    id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  branches?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  admin_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
  };
  
  // Stats
  branches_count?: number;
  active_branches_count?: number;
  total_students?: number;
  total_teachers?: number;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  tax_id?: string;
  website?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  
  // Stats
  schools_count?: number;
  active_schools_count?: number;
}

