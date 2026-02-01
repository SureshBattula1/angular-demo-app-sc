export interface School {
  id: number;
  company_id: number;
  name: string;
  code: string;
  main_branch_id?: number;
  status: 'Active' | 'Inactive' | 'Suspended' | 'UnderConstruction';
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  
  // Relationships
  company?: {
    id: number;
    name: string;
    code: string;
  };
  main_branch?: {
    id: number;
    name: string;
    code: string;
  };
  branches?: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  
  // Stats
  branches_count?: number;
  active_branches_count?: number;
  total_students?: number;
  total_teachers?: number;
}

export interface Company {
  id: number;
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

