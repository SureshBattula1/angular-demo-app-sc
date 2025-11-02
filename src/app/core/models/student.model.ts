export interface Student {
  id: number;
  user_id: number;
  branch_id: number;
  admission_number: string;
  admission_date: string;
  roll_number: string | null;
  
  // Academic Details
  grade: string;
  grade_label?: string;
  section: string | null;
  academic_year: string;
  stream: string | null;
  
  // Personal Details
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string | null;
  
  // Address
  current_address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  
  // Parent Information
  parent_id: number | null;
  father_name: string;
  father_occupation: string | null;
  father_phone: string;
  father_email: string | null;
  
  mother_name: string;
  mother_occupation: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string | null;
  
  // Previous Education
  previous_school: string | null;
  previous_grade: string | null;
  
  // Medical
  medical_history: string | null;
  allergies: string | null;
  
  // Branch relationship
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  
  // Status
  student_status: 'Active' | 'Graduated' | 'Left' | 'Suspended' | 'Expelled';
  
  // Profile picture
  profile_picture?: string;
  profile_picture_url?: string;
  
  // User relationship
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar?: string;
    avatar_url?: string;
    is_active: boolean;
    [key: string]: any;
  };
  
  is_active: boolean;
  
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface StudentFormData {
  // User Details
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password?: string;
  
  // Admission
  branch_id: number;
  admission_number: string;
  admission_date: string;
  roll_number?: string | null;
  
  // Academic
  grade: string;
  section?: string | null;
  academic_year: string;
  stream?: string | null;
  
  // Personal
  date_of_birth: string;
  gender: string;
  blood_group?: string | null;
  religion?: string | null;
  category?: string | null;
  
  // Address
  current_address: string;
  permanent_address?: string | null;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  
  // Parents
  father_name: string;
  father_phone: string;
  father_email?: string | null;
  father_occupation?: string | null;
  
  mother_name: string;
  mother_phone?: string | null;
  mother_email?: string | null;
  mother_occupation?: string | null;
  
  guardian_name?: string | null;
  guardian_phone?: string | null;
  
  // Emergency
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation?: string | null;
  
  // Previous Education
  previous_school?: string | null;
  previous_grade?: string | null;
  
  // Medical
  medical_history?: string | null;
  allergies?: string | null;
  
  remarks?: string | null;
}

