export interface Branch {
  id: number;
  name: string;
  code: string;
  branch_type: 'HeadOffice' | 'RegionalOffice' | 'School' | 'Campus' | 'SubBranch';
  parent_branch_id?: number;
  
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  region?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  
  // Contact
  phone: string;
  email: string;
  website?: string;
  fax?: string;
  emergency_contact?: string;
  
  // Principal
  principal_name?: string;
  principal_contact?: string;
  principal_email?: string;
  
  // Dates
  established_date?: string;
  opening_date?: string;
  closing_date?: string;
  
  // Academic
  board?: string;
  affiliation_number?: string;
  accreditations?: string[];
  grades_offered?: string[];
  academic_year_start?: string;
  academic_year_end?: string;
  current_academic_year?: string;
  
  // Capacity
  total_capacity?: number;
  current_enrollment?: number;
  capacity_utilization?: number;
  facilities?: string[];
  
  // Financial
  tax_id?: string;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  
  // Features
  is_main_branch: boolean;
  is_residential: boolean;
  has_hostel: boolean;
  has_transport: boolean;
  has_library: boolean;
  has_lab: boolean;
  has_canteen: boolean;
  has_sports: boolean;
  
  // Status
  is_active: boolean;
  status: 'Active' | 'Inactive' | 'UnderConstruction' | 'Maintenance' | 'Closed';
  logo?: string;
  settings?: Record<string, unknown>;
  
  // Relationships
  parent_branch?: Branch;
  child_branches?: Branch[];
  has_children?: boolean;
  has_parent?: boolean;
  
  // Stats
  total_users?: number;
  total_students?: number;
  total_teachers?: number;
  total_departments?: number;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface BranchStats {
  total_students: number;
  total_teachers: number;
  total_departments: number;
  active_students: number;
  active_teachers: number;
}

export interface BranchListResponse {
  success: boolean;
  data: Branch[];
  count: number;
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export interface BranchFormData {
  name: string;
  code: string;
  branch_type: string;
  parent_branch_id?: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  region?: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  principal_name?: string;
  principal_contact?: string;
  principal_email?: string;
  established_date?: string;
  board?: string;
  affiliation_number?: string;
  total_capacity?: number;
  is_main_branch?: boolean;
  has_hostel?: boolean;
  has_transport?: boolean;
  has_library?: boolean;
  has_lab?: boolean;
  has_canteen?: boolean;
  has_sports?: boolean;
  is_residential?: boolean;
  status?: string;
}

