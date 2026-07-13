export interface Teacher {
  id: string;
  user_id: number | string;
  branch_id: number | string;
  employee_id: string;
  category_type: 'Teaching' | 'Non-Teaching';
  designation: string;
  department_id?: number | string;
  
  // Enhanced Personal Details
  first_name: string;
  middle_name?: string;
  last_name: string;
  preferred_name?: string;
  title?: string; // Mr, Mrs, Dr, Prof
  suffix?: string; // Jr, Sr, III
  
  // Identity Documents
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  place_of_birth?: string;
  pan_number: string;
  aadhaar_number?: string;
  passport_number?: string;
  passport_expiry?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  voter_id?: string;
  
  // Enhanced Personal Information
  nationality?: string;
  religion?: string;
  caste?: string;
  sub_caste?: string;
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  mother_tongue?: string;
  languages_known?: string[];
  handicap_status?: 'None' | 'Physical' | 'Visual' | 'Hearing' | 'Mental' | 'Multiple';
  handicap_details?: string;
  
  // Family Information
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  spouse_date_of_birth?: string;
  spouse_occupation?: string;
  spouse_phone?: string;
  spouse_email?: string;
  number_of_children?: number;
  children_details?: any[];
  
  // Contact Information
  email: string;
  alternate_email?: string;
  phone?: string;
  alternate_phone?: string;
  whatsapp_number?: string;
  landline_number?: string;
  
  // Address Details
  current_address?: string;
  current_city?: string;
  current_state?: string;
  current_pincode?: string;
  current_country?: string;
  permanent_address?: string;
  permanent_city?: string;
  permanent_state?: string;
  permanent_pincode?: string;
  permanent_country?: string;
  // Database columns (mapped from current_*)
  city?: string;
  state?: string;
  pincode?: string;
  
  // Professional Details
  joining_date?: string;
  leaving_date?: string;
  employee_type?: 'Permanent' | 'Contract' | 'Temporary' | 'Visiting';
  employee_type_detail?: 'Full-time' | 'Part-time' | 'Consultant';
  employment_status?: 'Active' | 'On Leave' | 'Suspended';
  probation_end_date?: string;
  confirmation_date?: string;
  reporting_manager?: string;
  reporting_manager_id?: string;
  subordinates?: any[];
  specialization?: string;
  registration_number?: string;
  salary_grade?: string;
  
  // Teaching Assignment
  subjects?: string[];
  classes_assigned?: any[];
  is_class_teacher?: boolean;
  class_teacher_of_grade?: string;
  class_teacher_of_section?: string;
  
  // Educational Background
  qualification?: string;
  educational_qualifications?: any[];
  professional_certifications?: any[];
  training_programs?: any[];
  awards_recognitions?: any[];
  publications?: any[];
  research_projects?: any[];
  
  // Skills and Competencies
  experience_years?: number;
  teaching_experience_years?: number;
  industry_experience_years?: number;
  technical_skills?: string[];
  soft_skills?: string[];
  subject_expertise?: string[];
  teaching_methodologies?: string[];
  
  // Health and Medical
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  family_doctor_name?: string;
  family_doctor_phone?: string;
  family_doctor_address?: string;
  last_medical_checkup?: string;
  medical_insurance_details?: string;
  
  // Emergency Contacts
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_number?: string;
  emergency_contact_relation?: string;
  emergency_contact_2_name?: string;
  emergency_contact_2_phone?: string;
  emergency_contact_2_relation?: string;
  emergency_contact_2_address?: string;
  
  // Financial Information
  epf_number?: string;
  pf_number?: string;
  esi_number?: string;
  uan_number?: string;
  gratuity_number?: string;
  basic_salary?: number;
  ctc?: number;
  salary_components?: any[];
  deductions?: any[];
  income_tax_pan?: string;
  
  // Bank Account Information
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  account_title?: string;
  bank_branch_name?: string;
  
  // Additional Professional Information
  previous_employers?: any[];
  references?: any[];
  professional_memberships?: string;
  professional_license?: string;
  
  // Performance and Evaluation
  performance_reviews?: any[];
  appraisals?: any[];
  goals_objectives?: any[];
  training_needs?: any[];
  
  // Additional Information
  notes?: string;
  hobbies_interests?: string;
  volunteer_work?: string;
  community_involvement?: string;
  personal_statement?: string;
  career_objectives?: string;
  additional_notes?: string;
  
  // System Fields
  profile_picture?: string;
  profile_completion_percentage?: string;
  profile_verified?: boolean;
  last_profile_update?: string;
  updated_by?: string;
  teacher_status: 'Active' | 'OnLeave' | 'Resigned' | 'Retired' | 'Terminated';
  
  // Relationships
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

  branch?: {
    id: string;
    name: string;
    code: string;
  };

  department?: {
    id: string;
    name: string;
  };
  
  created_at?: string;
  updated_at?: string;
}

export interface TeacherFormData {
  // Basic Information
  first_name: string;
  middle_name?: string;
  last_name: string;
  preferred_name?: string;
  title?: string;
  suffix?: string;
  email: string;
  alternate_email?: string;
  phone?: string;
  alternate_phone?: string;
  whatsapp_number?: string;
  landline_number?: string;
  password?: string;
  branch_id: number | string;
  is_active?: boolean;

  // Teacher Specific
  employee_id: string;
  category_type: 'Teaching' | 'Non-Teaching';
  designation: string;
  department_id?: number | string;
  
  // Identity Documents
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  place_of_birth?: string;
  pan_number: string;
  aadhaar_number?: string;
  passport_number?: string;
  passport_expiry?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  voter_id?: string;
  
  // Enhanced Personal Information
  nationality?: string;
  religion?: string;
  caste?: string;
  sub_caste?: string;
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  mother_tongue?: string;
  languages_known?: string[];
  handicap_status?: 'None' | 'Physical' | 'Visual' | 'Hearing' | 'Mental' | 'Multiple';
  handicap_details?: string;
  
  // Family Information
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  spouse_date_of_birth?: string;
  spouse_occupation?: string;
  spouse_phone?: string;
  spouse_email?: string;
  number_of_children?: number;
  children_details?: any[];
  
  // Address Details
  current_address?: string;
  current_city?: string;
  current_state?: string;
  current_pincode?: string;
  current_country?: string;
  permanent_address?: string;
  permanent_city?: string;
  permanent_state?: string;
  permanent_pincode?: string;
  permanent_country?: string;
  
  // Professional Details
  joining_date?: string;
  employee_type?: 'Permanent' | 'Contract' | 'Temporary';
  employee_type_detail?: 'Full-time' | 'Part-time' | 'Consultant';
  employment_status?: 'Active' | 'On Leave' | 'Suspended';
  probation_end_date?: string;
  confirmation_date?: string;
  reporting_manager?: string;
  reporting_manager_id?: string;
  
  // Educational Background
  qualification?: string;
  educational_qualifications?: any[];
  professional_certifications?: any[];
  training_programs?: any[];
  awards_recognitions?: any[];
  publications?: any[];
  research_projects?: any[];
  
  // Skills and Competencies
  experience_years?: number;
  teaching_experience_years?: number;
  industry_experience_years?: number;
  technical_skills?: string[];
  soft_skills?: string[];
  subject_expertise?: string[];
  teaching_methodologies?: string[];
  
  // Health and Medical
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  family_doctor_name?: string;
  family_doctor_phone?: string;
  family_doctor_address?: string;
  last_medical_checkup?: string;
  medical_insurance_details?: string;
  
  // Emergency Contacts
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_number?: string;
  emergency_contact_relation?: string;
  emergency_contact_2_name?: string;
  emergency_contact_2_phone?: string;
  emergency_contact_2_relation?: string;
  emergency_contact_2_address?: string;
  
  // Financial Information
  epf_number?: string;
  pf_number?: string;
  esi_number?: string;
  uan_number?: string;
  gratuity_number?: string;
  basic_salary?: number;
  ctc?: number;
  salary_components?: any[];
  deductions?: any[];
  income_tax_pan?: string;
  
  // Bank Account Information
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  account_title?: string;
  bank_branch_name?: string;
  
  // Additional Professional Information
  previous_employers?: any[];
  references?: any[];
  professional_memberships?: string;
  professional_license?: string;
  
  // Performance and Evaluation
  performance_reviews?: any[];
  appraisals?: any[];
  goals_objectives?: any[];
  training_needs?: any[];
  
  // Additional Information
  notes?: string;
  hobbies_interests?: string;
  volunteer_work?: string;
  community_involvement?: string;
  personal_statement?: string;
  career_objectives?: string;
  additional_notes?: string;
  
  // Documents
  profile_picture?: File;
  resume_file?: File;
  joining_letter_file?: File;
  resignation_letter_file?: File;
  other_documents_file?: File;
  aadhaar_file?: File;
  pan_file?: File;
  passport_file?: File;
  driving_license_file?: File;
}

