export interface Student {
  id: string;
  user_id: number | string;
  branch_id: number | string;
  admission_number: string;
  admission_date: string | Date;
  roll_number: string | null;
  
  // Academic Details
  grade: string;
  grade_label?: string;
  section: string | null;
  academic_year: string;
  academic_year_id?: number | string | null;
  current_grade?: string;
  current_grade_label?: string;
  current_section?: string | null;
  current_academic_year_id?: number | string | null;
  stream: string | null;
  elective_subjects?: string;
  
  // Personal Details
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | Date;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string | null;
  nationality?: string;
  religion?: string;
  category?: string;
  mother_tongue?: string;
  registration_number?: string;
  
  // Address
  current_address: string;
  current_district?: string | null;
  current_landmark?: string | null;
  permanent_address?: string;
  permanent_district?: string | null;
  permanent_landmark?: string | null;
  correspondence_address?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  
  // Identity Documents
  aadhaar_number?: string | null;
  pen_number?: string | null;
  birth_certificate_number?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | Date | null;
  student_id_card_number?: string | null;
  voter_id?: string | null;
  ration_card_number?: string | null;
  domicile_certificate_number?: string | null;
  income_certificate_number?: string | null;
  caste_certificate_number?: string | null;
  
  // Sibling Information
  number_of_siblings?: number;
  sibling_details?: any[] | string | null;
  sibling_discount_applicable?: boolean;
  sibling_discount_percentage?: number;
  
  // Parent Information
  parent_id: number | string | null;
  father_name: string;
  father_occupation: string | null;
  father_phone: string;
  father_email: string | null;
  father_qualification?: string | null;
  father_organization?: string | null;
  father_designation?: string | null;
  father_annual_income?: number;
  father_aadhaar?: string | null;
  
  mother_name: string;
  mother_occupation: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  mother_qualification?: string | null;
  mother_organization?: string | null;
  mother_designation?: string | null;
  mother_annual_income?: number;
  mother_aadhaar?: string | null;
  
  // Guardian Information
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  guardian_qualification?: string | null;
  guardian_occupation?: string | null;
  guardian_email?: string | null;
  guardian_address?: string | null;
  guardian_annual_income?: number;
  
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string | null;
  
  // Transport Details
  transport_required?: boolean;
  transport_route?: string | null;
  pickup_point?: string | null;
  drop_point?: string | null;
  vehicle_number?: string | null;
  pickup_time?: string | null;
  drop_time?: string | null;
  transport_fee?: number;
  
  // Hostel
  hostel_required?: boolean;
  hostel_name?: string | null;
  hostel_room_number?: string | null;
  hostel_fee?: number;
  
  // Library
  library_card_number?: string | null;
  library_card_issue_date?: string | null;
  library_card_expiry_date?: string | null;
  
  // Previous Education
  previous_school: string | null;
  previous_grade: string | null;
  previous_school_board?: string | null;
  previous_school_address?: string | null;
  previous_school_phone?: string | null;
  previous_percentage?: number;
  transfer_certificate_number?: string;
  tc_number?: string | null;
  tc_date?: string | null;
  previous_student_id?: string | null;
  medium_of_instruction?: string | null;
  language_preferences?: any[] | string | null;
  
  // Medical
  medical_history: string | null;
  allergies: string | null;
  medications?: string;
  height_cm?: number;
  weight_kg?: number;
  vision_status?: string | null;
  hearing_status?: string | null;
  chronic_conditions?: string | null;
  current_medications?: string | null;
  medical_insurance?: boolean;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  last_health_checkup?: string | null;
  family_doctor_name?: string | null;
  family_doctor_phone?: string | null;
  vaccination_status?: string | null;
  vaccination_records?: any[] | string | null;
  special_needs?: boolean;
  special_needs_details?: string | null;
  
  // Fee & Scholarship
  fee_concession_applicable?: boolean;
  concession_type?: string | null;
  concession_percentage?: number;
  scholarship_name?: string | null;
  scholarship_details?: string | null;
  economic_status?: string | null;
  family_annual_income?: number;
  
  // Additional Information
  hobbies_interests?: any[] | string | null;
  extra_curricular_activities?: any[] | string | null;
  achievements?: any[] | string | null;
  sports_participation?: any[] | string | null;
  cultural_activities?: any[] | string | null;
  behavior_records?: string | null;
  counselor_notes?: string | null;
  special_instructions?: string | null;
  
  // Branch relationship
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Status
  student_status: 'Active' | 'Graduated' | 'Left' | 'Suspended' | 'Expelled';
  admission_type?: string | null;
  admission_status?: string;
  leaving_date?: string | null;
  leaving_reason?: string | null;
  tc_issued_number?: string | null;
  remarks?: string;
  documents?: any;
  
  // Profile picture
  profile_picture?: string;
  profile_picture_url?: string;
  
  // User relationship
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar?: string;
    avatar_url?: string;
    is_active: boolean;
    [key: string]: any;
  };
  account_is_active?: boolean;
  account_status_label?: string;
  
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
  branch_id: number | string;
  admission_number: string;
  admission_date: string | Date;
  roll_number?: string | null;
  
  // Academic
  grade: string;
  section?: string | null;
  academic_year_id: number | string;
  stream?: string | null;
  
  // Personal
  date_of_birth: string | Date;
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

