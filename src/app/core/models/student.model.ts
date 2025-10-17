export interface Student {
  id: number;
  user_id: number;
  branch_id: number;
  admission_number: string;
  admission_date: string;
  roll_number: string | null;
  registration_number: string | null;
  
  // Academic Details
  grade: string;
  section: string | null;
  academic_year: string;
  stream: string | null;
  elective_subjects: string[] | null;
  
  // Personal Details
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string | null;
  religion: string | null;
  category: string | null;
  nationality: string;
  mother_tongue: string | null;
  
  // Address
  current_address: string;
  permanent_address: string | null;
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
  father_annual_income: number | null;
  
  mother_name: string;
  mother_occupation: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  mother_annual_income: number | null;
  
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_phone: string | null;
  
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string | null;
  
  // Previous Education
  previous_school: string | null;
  previous_grade: string | null;
  previous_percentage: number | null;
  transfer_certificate_number: string | null;
  
  // Medical
  medical_history: string | null;
  allergies: string | null;
  medications: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  
  // Status
  student_status: 'Active' | 'Graduated' | 'Left' | 'Suspended' | 'Expelled';
  admission_status: 'Admitted' | 'Provisional' | 'Cancelled';
  
  remarks: string | null;
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

