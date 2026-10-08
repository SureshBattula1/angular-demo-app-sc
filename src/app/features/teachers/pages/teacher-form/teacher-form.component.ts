import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TeacherService } from '../../services/teacher.service';
import { BranchService } from '../../../branches/services/branch.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Teacher, TeacherFormData } from '../../../../core/models/teacher.model';
import { UniversalAttachmentsComponent } from '../../../../shared/components/universal-attachments/universal-attachments.component';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule, UniversalAttachmentsComponent],
  templateUrl: './teacher-form.component.html',
  styleUrls: ['./teacher-form.component.scss']
})
export class TeacherFormComponent implements OnInit {
  @ViewChild(UniversalAttachmentsComponent) attachmentsComponent!: UniversalAttachmentsComponent;
  
  teacherForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitted = false;  // Track if form has been submitted
  teacherId?: string;
  currentTeacher?: Teacher;
  
  branches: any[] = [];
  departments: any[] = [];
  reportingManagers: any[] = [];
  profilePicturePreview: string | null = null;
  sameAsPermanentAddress = false;
  
  // For attachments - will be set after teacher is created/updated
  attachmentModuleId: string | number | null = null;
  
  // Form sections visibility
  showPayrollDetails = false;
  showBankDetails = false;
  showSocialMedia = false;
  showDocuments = false;
  showHealthInfo = false;
  showAdditionalInfo = false;

  hidePassword = true;

  // Language options
  languageOptions = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati',
    'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Nepali',
    'Sanskrit', 'French', 'German', 'Spanish', 'Chinese', 'Japanese', 'Arabic'
  ];

  // Blood group options
  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Handicap status options
  handicapStatusOptions = ['None', 'Physical', 'Visual', 'Hearing', 'Mental', 'Multiple'];

  // Teaching designations
  teachingDesignations = [
    'Principal',
    'Vice Principal',
    'Head of Department',
    'Senior Teacher',
    'Teacher',
    'Assistant Teacher',
    'Subject Teacher',
    'Lab Instructor',
    'Physical Education Teacher',
    'Art Teacher',
    'Music Teacher',
    'Librarian',
    'Counselor'
  ];

  // Staff designations
  staffDesignations = [
    'Administrative Officer',
    'Office Manager',
    'Clerk',
    'Receptionist',
    'Lab Assistant',
    'Library Assistant',
    'Peon',
    'Security Guard',
    'Janitor',
    'Driver',
    'IT Support',
    'Maintenance Staff'
  ];

  // Account designations
  accountDesignations = [
    'Accountant',
    'Senior Accountant',
    'Finance Manager',
    'Accounts Officer',
    'Finance Assistant'
  ];

  // Technical Skills options
  technicalSkillOptions = [
    'Programming', 'Web Development', 'Database Management', 'Data Analysis',
    'Microsoft Office', 'Google Workspace', 'LMS (Moodle, Canvas)', 'Video Editing',
    'Graphic Design', 'Animation', 'CAD Software', 'Laboratory Equipment',
    'Smart Board Operation', 'Online Teaching Tools', 'Assessment Tools',
    'Audio Production', 'Photography', 'STEM Equipment', 'Research Tools',
    'Statistical Software (SPSS, R)', 'GIS Software', 'Engineering Software'
  ];

  // Soft Skills options
  softSkillOptions = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
    'Time Management', 'Adaptability', 'Critical Thinking', 'Creativity',
    'Conflict Resolution', 'Empathy', 'Patience', 'Active Listening',
    'Motivation', 'Organization', 'Decision Making', 'Mentoring',
    'Collaboration', 'Emotional Intelligence', 'Stress Management',
    'Public Speaking', 'Classroom Management', 'Student Engagement'
  ];

  // Subject Expertise options
  subjectOptions = [
    'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
    'English', 'Hindi', 'Social Studies', 'History', 'Geography',
    'Economics', 'Political Science', 'Computer Science', 'Information Technology',
    'Physical Education', 'Art & Craft', 'Music', 'Dance',
    'Environmental Science', 'Psychology', 'Sociology', 'Philosophy',
    'Commerce', 'Accountancy', 'Business Studies', 'Statistics',
    'Sanskrit', 'Other Languages', 'Home Science', 'Agriculture'
  ];

  // Teaching Methodologies options
  teachingMethodOptions = [
    'Lecture Method', 'Discussion Method', 'Demonstration Method',
    'Project-Based Learning', 'Problem-Based Learning', 'Inquiry-Based Learning',
    'Flipped Classroom', 'Blended Learning', 'Experiential Learning',
    'Collaborative Learning', 'Cooperative Learning', 'Peer Teaching',
    'Montessori Method', 'Waldorf Education', 'Play-Based Learning',
    'Differentiated Instruction', 'Interactive Teaching', 'Visual Learning',
    'Hands-on Activities', 'Field Trips', 'Role Playing', 'Case Studies',
    'STEM/STEAM Approach', 'Socratic Method', 'Direct Instruction'
  ];

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private branchService: BranchService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.departments = [];
    this.teacherForm.get('department_id')?.disable({ emitEvent: false });
    
    // Listen to category_type changes to update designation options
    this.teacherForm.get('category_type')?.valueChanges.subscribe(() => {
      this.teacherForm.get('designation')?.setValue('');
    });

    // Listen to branch changes to load reporting managers
    this.teacherForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      if (branchId) {
        this.loadReportingManagers(branchId);
        this.loadDepartments(branchId);
        this.teacherForm.get('department_id')?.enable({ emitEvent: false });
      }
      if (!branchId) {
        this.departments = [];
        this.teacherForm.get('department_id')?.setValue(null, { emitEvent: false });
        this.teacherForm.get('department_id')?.disable({ emitEvent: false });
      }
    });
    
    // ✅ Listen to permanent address changes and auto-update current address if checkbox is checked
    this.setupAddressSyncListeners();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.teacherId = params['id'];
        this.isEditMode = true;
        this.loadTeacher(this.teacherId!);
      }
    });
  }

  private parseToDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const str = String(value).trim();
    const dateOnly = str.includes('T') ? str.split('T')[0] : str;
    const d = new Date(dateOnly);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatDate(value: any): string | null {
    const d = this.parseToDate(value);
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private initForm(): void {
    this.teacherForm = this.fb.group({
      // Basic Information
      first_name: ['', [Validators.required, Validators.maxLength(255)]],
      middle_name: [''],
      last_name: ['', [Validators.required, Validators.maxLength(255)]],
      preferred_name: [''],
      title: [''],
      suffix: [''],
      email: ['', [Validators.required, Validators.email]],
      alternate_email: ['', Validators.email],
      phone: [''],
      alternate_phone: [''],
      whatsapp_number: [''],
      landline_number: [''],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      branch_id: [null, Validators.required],
      
      // Teacher Specific
      employee_id: ['', [Validators.required, Validators.maxLength(50)]],
      category_type: ['Teaching', Validators.required], // Teaching→Teacher, Staff→Staff, Account→Accountant
      designation: ['', [Validators.required, Validators.maxLength(255)]],
      department_id: [null],
      
      // Identity Documents
      gender: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      place_of_birth: [''],
      // PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F). Pattern accepts a-z/A-Z; we normalize to uppercase on blur.
      pan_number: ['', [Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/)]],
      aadhaar_number: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      passport_number: [''],
      passport_expiry: [''],
      driving_license_number: [''],
      driving_license_expiry: [''],
      voter_id: [''],
      
      // Enhanced Personal Information
      nationality: ['Indian'],
      religion: [''],
      caste: [''],
      sub_caste: [''],
      blood_group: [''],
      mother_tongue: [''],
      languages_known: [[]],
      handicap_status: ['None'],
      handicap_details: [''],
      
      // Family Information
      father_name: [''],
      mother_name: [''],
      spouse_name: [''],
      spouse_date_of_birth: [''],
      spouse_occupation: [''],
      spouse_phone: [''],
      spouse_email: ['', Validators.email],
      number_of_children: [0, [Validators.min(0), Validators.max(20)]],
      children_details: [[]],
      
      // Address Details (address is a required field in database)
      address: [''], // Main address field required by database
      current_address: [''],
      current_city: [''],
      current_state: [''],
      current_pincode: [''],
      current_country: ['India'],
      permanent_address: [''],
      permanent_city: [''],
      permanent_state: [''],
      permanent_pincode: [''],
      permanent_country: ['India'],
      
      // Professional Details
      joining_date: [''],
      employee_type: ['Permanent'],
      employee_type_detail: ['Full-time'],
      employment_status: ['Active'],
      probation_end_date: [''],
      confirmation_date: [''],
      reporting_manager: [''],
      reporting_manager_id: [''],
      
      // Educational Background
      qualification: [''],
      educational_qualifications: [[]],
      professional_certifications: [[]],
      training_programs: [[]],
      awards_recognitions: [[]],
      publications: [[]],
      research_projects: [[]],
      
      // Skills and Competencies
      experience_years: [0, [Validators.min(0), Validators.max(50)]],
      teaching_experience_years: [0, [Validators.min(0), Validators.max(50)]],
      industry_experience_years: [0, [Validators.min(0), Validators.max(50)]],
      technical_skills: [[]],
      soft_skills: [[]],
      subject_expertise: [[]],
      teaching_methodologies: [[]],
      
      // Health and Medical
      medical_history: [''],
      allergies: [''],
      current_medications: [''],
      family_doctor_name: [''],
      family_doctor_phone: [''],
      family_doctor_address: [''],
      last_medical_checkup: [''],
      medical_insurance_details: [''],
      
      // Emergency Contacts
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      emergency_contact_number: [''],
      emergency_contact_relation: [''],
      emergency_contact_2_name: [''],
      emergency_contact_2_phone: [''],
      emergency_contact_2_relation: [''],
      emergency_contact_2_address: [''],
      
      // Financial Information
      epf_number: [''],
      pf_number: [''],
      esi_number: [''],
      uan_number: [''],
      gratuity_number: [''],
      basic_salary: [0, [Validators.min(0)]],
      ctc: [0, [Validators.min(0)]],
      salary_components: [[]],
      deductions: [[]],
      income_tax_pan: [''],
      
      // Bank Account Information
      bank_name: [''],
      bank_account_number: [''],
      bank_ifsc_code: [''],
      account_title: [''],
      bank_branch_name: [''],
      
      // Additional Professional Information
      previous_employers: [[]],
      references: [[]],
      professional_memberships: [''],
      professional_license: [''],
      
      // Performance and Evaluation
      performance_reviews: [[]],
      appraisals: [[]],
      goals_objectives: [[]],
      training_needs: [[]],
      
      // Additional Information
      notes: [''],
      hobbies_interests: [''],
      volunteer_work: [''],
      community_involvement: [''],
      personal_statement: [''],
      career_objectives: [''],
      additional_notes: [''],
      
      // Documents
      profile_picture: [null],
      resume_file: [null],
      joining_letter_file: [null],
      resignation_letter_file: [null],
      other_documents_file: [null],
      aadhaar_file: [null],
      pan_file: [null],
      passport_file: [null],
      driving_license_file: [null]
    });
  }

  private loadTeacher(id: string): void {
    this.isLoading = true;
    
    this.teacherService.getTeacher(id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.currentTeacher = response.data;
          const teacher = response.data;
          
          // Patch form with teacher data
          // Handle nested user data
          const formData: any = {
            ...teacher,
            first_name: teacher.user?.first_name || teacher.first_name,
            last_name: teacher.user?.last_name || teacher.last_name,
            email: teacher.user?.email || teacher.email,
            phone: teacher.user?.phone || teacher.phone,
            is_active: teacher.user?.is_active ?? teacher.is_active
          };
          
          // Remove computed/non-database fields
          const fieldsToRemove = ['profile_completion_percentage', 'last_profile_update', 'user'];
          fieldsToRemove.forEach(field => {
            delete formData[field];
          });

          // Convert date fields to Date for mat-datepicker
          const dateFields = ['date_of_birth', 'joining_date', 'leaving_date', 'probation_end_date',
            'confirmation_date', 'spouse_date_of_birth', 'passport_expiry', 'driving_license_expiry',
            'last_medical_checkup'];
          dateFields.forEach(field => {
            if (formData[field]) {
              formData[field] = this.parseToDate(formData[field]);
            }
          });
          
          // Map legacy Non-Teaching to Staff for backward compatibility
          if (formData.category_type === 'Non-Teaching') {
            formData.category_type = 'Staff';
          }
          // Use emitEvent: false to prevent category_type valueChanges from clearing designation
          this.teacherForm.patchValue(formData, { emitEvent: false });
          
          // Load reporting managers for the current branch
          if (teacher.branch_id) {
            this.loadReportingManagers(teacher.branch_id);
            this.loadDepartments(teacher.branch_id);
            this.teacherForm.get('department_id')?.enable({ emitEvent: false });
          }
          
          // Load profile picture preview if exists
          if (teacher.profile_picture) {
            // The backend already returns a full URL, use it directly
            this.profilePicturePreview = teacher.profile_picture;
          }
          
          // Remove password requirement for edit mode
          this.teacherForm.get('password')?.clearValidators();
          this.teacherForm.get('password')?.updateValueAndValidity();
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.branches = response.data || [];
          console.log('Branches loaded:', this.branches.length);
        }
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
        this.errorHandler.showError('Failed to load branches');
        this.branches = [];
      }
    });
  }

  private loadDepartments(branchId: number): void {
    this.departmentService.getDepartments({ branch_id: branchId, is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.departments = response.data || [];

          // If a department is already selected (edit mode), ensure it exists in this branch; otherwise clear it.
          const selectedDepartmentId = this.teacherForm.get('department_id')?.value;
          if (selectedDepartmentId && !this.departments.some(d => d.id === selectedDepartmentId)) {
            this.teacherForm.get('department_id')?.setValue(null, { emitEvent: false });
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  private loadReportingManagers(branchId: number): void {
    // Load teachers from the same branch to populate reporting manager dropdown
    this.teacherService.getTeachers({ branch_id: branchId, is_active: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Filter out current teacher if in edit mode
          this.reportingManagers = response.data.filter((teacher: any) => {
            return !this.teacherId || teacher.id !== this.teacherId;
          });
        }
      },
      error: (error: any) => {
        console.error('Error loading reporting managers:', error);
      }
    });
  }

  get designationOptions(): string[] {
    const categoryType = this.teacherForm.get('category_type')?.value;
    if (categoryType === 'Teaching') {
      return this.teachingDesignations;
    } else if (categoryType === 'Staff') {
      return this.staffDesignations;
    } else if (categoryType === 'Account') {
      return this.accountDesignations;
    }
    return [];
  }

  onSubmit(): void {
    this.isSubmitted = true;  // Mark form as submitted
    
    if (this.teacherForm.invalid) {
      this.markFormGroupTouched(this.teacherForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      
      // Scroll to first invalid field
      this.scrollToFirstInvalidControl();
      return;
    }

    this.isLoading = true;
    
    // Use getRawValue() to include disabled fields (like current_address when checkbox is checked)
    const formData = { ...this.teacherForm.getRawValue() };

    // Normalize date fields to YYYY-MM-DD for backend
    const dateFields = ['date_of_birth', 'joining_date', 'leaving_date', 'probation_end_date',
      'confirmation_date', 'spouse_date_of_birth', 'passport_expiry', 'driving_license_expiry',
      'last_medical_checkup'];
    dateFields.forEach(field => {
      if (formData[field]) {
        const formatted = this.formatDate(formData[field]);
        if (formatted) {
          formData[field] = formatted;
        }
      }
    });
    
    // If "Same as Permanent Address" is checked, copy permanent address to current address fields
    if (this.sameAsPermanentAddress) {
      formData.current_address = formData.permanent_address || '';
      formData.current_city = formData.permanent_city || '';
      formData.current_state = formData.permanent_state || '';
      formData.current_pincode = formData.permanent_pincode || '';
      formData.current_country = formData.permanent_country || 'India';
    }
    
    // Remove password if empty in edit mode
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    // Remove File objects for API call
    const fileFields = ['resume_file', 'joining_letter_file', 'resignation_letter_file', 
                       'other_documents_file', 'aadhaar_file', 'pan_file', 
                       'passport_file', 'driving_license_file'];
    
    fileFields.forEach(field => {
      if (formData[field]) {
        delete formData[field];
      }
    });
    
    // Remove profile_picture File object if exists (already uploaded)
    if (formData.profile_picture instanceof File) {
      delete formData.profile_picture;
    }

    // Remove computed fields that don't exist in the database
    const computedFields = ['profile_completion_percentage', 'last_profile_update'];
    computedFields.forEach(field => {
      if (formData[field] !== undefined) {
        delete formData[field];
      }
    });

    // Ensure address field is always set (required by database)
    const currentAddr = (formData.current_address || '').trim();
    const permanentAddr = (formData.permanent_address || '').trim();
    formData.address = currentAddr || permanentAddr || 'N/A';

    // Normalize PAN to uppercase (format ABCDE1234F)
    if (formData.pan_number && typeof formData.pan_number === 'string') {
      formData.pan_number = formData.pan_number.trim().toUpperCase();
    }

    // Save the teacher (profile picture already uploaded if it was a file)
    this.saveTeacher(formData);
  }

  saveTeacher(formData: any): void {

    
    const request = this.isEditMode && this.teacherId
      ? this.teacherService.updateTeacher(this.teacherId, formData)
      : this.teacherService.createTeacher(formData);

    request.subscribe({
      next: (response: any) => {

        if (response.success) {
          this.handleSuccess(response);
        } else {
          this.errorHandler.showError('Failed to save teacher');
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Teacher save error:', error);
        this.errorHandler.showError(error);
        this.isLoading = false;
      }
    });
  }

  handleSuccess(response: any): void {
    // Set attachment module ID after teacher is created/updated
    if (!this.isEditMode && response.data?.id) {
      this.attachmentModuleId = response.data.id;
      
      // Upload profile picture if exists (for create mode)
      if (this.profilePictureFile) {
        this.uploadProfilePictureForNewTeacher(response.data.id);
        return; // Don't navigate yet, wait for upload
      }
    } else if (this.teacherId) {
      this.attachmentModuleId = this.teacherId;
    }
    
    // Upload any pending attachments
    setTimeout(() => {
      this.attachmentsComponent?.uploadPendingAttachments();
    }, 500);
    
    this.errorHandler.showSuccess(
      this.isEditMode ? 'Teacher updated successfully' : 'Teacher created successfully'
    );
    this.router.navigate(['/teachers']);
  }

  uploadProfilePictureForNewTeacher(teacherId: number): void {
    if (!this.profilePictureFile) return;
    

    const uploadPath = `teachers/${teacherId}/profile_picture`;
    
    this.fileUploadService.uploadFile(this.profilePictureFile, uploadPath).subscribe({
      next: (uploadResponse: any) => {

        
        if (uploadResponse.success && uploadResponse.data?.file_path) {
          // Update teacher with profile picture path
          const updateData = { profile_picture: uploadResponse.data.file_path };
          
          this.teacherService.updateTeacher(teacherId, updateData).subscribe({
            next: (updateResponse: any) => {

              
              // Upload any pending attachments
              setTimeout(() => {
                this.attachmentsComponent?.uploadPendingAttachments();
              }, 500);
              
              this.errorHandler.showSuccess('Teacher created successfully');
              this.router.navigate(['/teachers']);
            },
            error: (error: any) => {
              console.error('Failed to update teacher with profile picture:', error);
              this.errorHandler.showWarning('Teacher created but profile picture update failed');
              
              // Still navigate to teachers list
              setTimeout(() => {
                this.attachmentsComponent?.uploadPendingAttachments();
              }, 500);
              
              this.router.navigate(['/teachers']);
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Profile picture upload error:', error);
        this.errorHandler.showWarning('Teacher created but profile picture upload failed');
        
        // Still navigate to teachers list
        setTimeout(() => {
          this.attachmentsComponent?.uploadPendingAttachments();
        }, 500);
        
        this.router.navigate(['/teachers']);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/teachers']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      control?.markAsDirty();  // Also mark as dirty to ensure mat-error shows
    });
  }
  
  private scrollToFirstInvalidControl(): void {
    const firstInvalidControl = document.querySelector('.mat-form-field-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /** Normalize PAN number to uppercase and trim so validation and display match format ABCDE1234F */
  normalizePanNumber(): void {
    const control = this.teacherForm.get('pan_number');
    if (!control) return;
    const raw = control.value;
    if (typeof raw === 'string' && raw.trim()) {
      const normalized = raw.trim().toUpperCase();
      if (normalized !== raw) {
        control.setValue(normalized, { emitEvent: false });
      }
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.teacherForm.get(fieldName);
    
    // Only show errors if field is touched or form is submitted
    if (!control || (!control.touched && !this.isSubmitted)) {
      return '';
    }
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be greater than or equal to ${control.errors?.['min'].min}`;
    }
    
    if (control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} must be less than or equal to ${control.errors?.['max'].max}`;
    }
    
    if (control?.hasError('pattern')) {
      if (fieldName === 'pan_number') {
        return 'PAN must be in format ABCDE1234F (5 letters, 4 digits, 1 letter)';
      }
      if (fieldName === 'aadhaar_number') {
        return 'Aadhaar number must be 12 digits';
      }
      return `${this.getFieldLabel(fieldName)} format is invalid`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      middle_name: 'Middle Name',
      preferred_name: 'Preferred Name',
      title: 'Title',
      suffix: 'Suffix',
      email: 'Email',
      alternate_email: 'Alternate Email',
      phone: 'Phone',
      alternate_phone: 'Alternate Phone',
      whatsapp_number: 'WhatsApp Number',
      landline_number: 'Landline Number',
      password: 'Password',
      branch_id: 'Branch',
      employee_id: 'Employee ID',
      category_type: 'Category Type',
      designation: 'Designation',
      department_id: 'Department',
      gender: 'Gender',
      date_of_birth: 'Date of Birth',
      place_of_birth: 'Place of Birth',
      pan_number: 'PAN Number',
      aadhaar_number: 'Aadhaar Number',
      passport_number: 'Passport Number',
      passport_expiry: 'Passport Expiry',
      driving_license_number: 'Driving License Number',
      driving_license_expiry: 'Driving License Expiry',
      voter_id: 'Voter ID',
      nationality: 'Nationality',
      religion: 'Religion',
      caste: 'Caste',
      sub_caste: 'Sub Caste',
      blood_group: 'Blood Group',
      mother_tongue: 'Mother Tongue',
      languages_known: 'Languages Known',
      handicap_status: 'Handicap Status',
      handicap_details: 'Handicap Details',
      father_name: 'Father Name',
      mother_name: 'Mother Name',
      spouse_name: 'Spouse Name',
      spouse_date_of_birth: 'Spouse Date of Birth',
      spouse_occupation: 'Spouse Occupation',
      spouse_phone: 'Spouse Phone',
      spouse_email: 'Spouse Email',
      number_of_children: 'Number of Children',
      current_address: 'Current Address',
      current_city: 'Current City',
      current_state: 'Current State',
      current_pincode: 'Current Pincode',
      current_country: 'Current Country',
      permanent_address: 'Permanent Address',
      permanent_city: 'Permanent City',
      permanent_state: 'Permanent State',
      permanent_pincode: 'Permanent Pincode',
      permanent_country: 'Permanent Country',
      joining_date: 'Joining Date',
      employee_type: 'Employee Type',
      employee_type_detail: 'Employee Type Detail',
      employment_status: 'Employment Status',
      probation_end_date: 'Probation End Date',
      confirmation_date: 'Confirmation Date',
      reporting_manager: 'Reporting Manager',
      reporting_manager_id: 'Reporting Manager ID',
      qualification: 'Qualification',
      experience_years: 'Experience Years',
      teaching_experience_years: 'Teaching Experience Years',
      industry_experience_years: 'Industry Experience Years',
      medical_history: 'Medical History',
      allergies: 'Allergies',
      current_medications: 'Current Medications',
      family_doctor_name: 'Family Doctor Name',
      family_doctor_phone: 'Family Doctor Phone',
      family_doctor_address: 'Family Doctor Address',
      last_medical_checkup: 'Last Medical Checkup',
      medical_insurance_details: 'Medical Insurance Details',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_phone: 'Emergency Contact Phone',
      emergency_contact_number: 'Emergency Contact Number',
      emergency_contact_relation: 'Emergency Contact Relation',
      emergency_contact_2_name: 'Emergency Contact 2 Name',
      emergency_contact_2_phone: 'Emergency Contact 2 Phone',
      emergency_contact_2_relation: 'Emergency Contact 2 Relation',
      emergency_contact_2_address: 'Emergency Contact 2 Address',
      epf_number: 'EPF Number',
      pf_number: 'PF Number',
      esi_number: 'ESI Number',
      uan_number: 'UAN Number',
      gratuity_number: 'Gratuity Number',
      basic_salary: 'Basic Salary',
      ctc: 'CTC',
      income_tax_pan: 'Income Tax PAN',
      bank_name: 'Bank Name',
      bank_account_number: 'Bank Account Number',
      bank_ifsc_code: 'Bank IFSC Code',
      account_title: 'Account Title',
      bank_branch_name: 'Bank Branch Name',
      professional_memberships: 'Professional Memberships',
      professional_license: 'Professional License',
      notes: 'Notes',
      hobbies_interests: 'Hobbies and Interests',
      volunteer_work: 'Volunteer Work',
      community_involvement: 'Community Involvement',
      personal_statement: 'Personal Statement',
      career_objectives: 'Career Objectives',
      additional_notes: 'Additional Notes'
    };
    return labels[fieldName] || fieldName;
  }

  onProfileFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (1MB)
    if (file.size > 1048576) {
      this.errorHandler.showError('Profile picture must be less than 1MB');
      return;
    }
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicturePreview = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Upload immediately if we have a teacher ID (edit mode)
    if (this.isEditMode && this.teacherId) {

      this.uploadProfilePictureImmediately(file);
    } else {
      // Create mode: store file, will upload after teacher is created

      this.teacherForm.get('profile_picture')?.setValue(file);
      this.profilePictureFile = file; // Store for later upload
    }
  }

  uploadProfilePictureImmediately(file: File): void {

    this.isLoading = true;
    
    const uploadPath = `teachers/${this.teacherId}/profile_picture`;

    
    this.fileUploadService.uploadFile(file, uploadPath).subscribe({
      next: (uploadResponse: any) => {

        this.isLoading = false;
        
        if (uploadResponse.success && uploadResponse.data?.file_path) {
          // Store the file path in the form
          this.teacherForm.get('profile_picture')?.setValue(uploadResponse.data.file_path);
          // Keep FileReader base64 preview - it already shows the new image; using server URL would risk browser cache showing old image
          
          // Update teacher record with the new path
          const updateData = { profile_picture: uploadResponse.data.file_path };

          
          this.teacherService.updateTeacher(this.teacherId!, updateData).subscribe({
            next: (updateResponse: any) => {

              this.errorHandler.showSuccess('Profile picture uploaded successfully');
            },
            error: (error: any) => {
              console.error('Failed to update teacher with profile picture:', error);
              this.errorHandler.showWarning('Image uploaded but update failed');
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Profile picture upload error:', error);
        this.isLoading = false;
        this.errorHandler.showError('Failed to upload profile picture');
      }
    });
  }

  // Property to store profile picture file for create mode
  profilePictureFile: File | null = null;

  removeProfilePicture(): void {
    // Clear preview
    this.profilePicturePreview = null;
    
    // Clear form value (set to null to delete the image from database)
    this.teacherForm.get('profile_picture')?.setValue(null);
    
    // If in edit mode, update teacher to remove profile picture
    if (this.isEditMode && this.teacherId) {

      
      const updateData: any = { profile_picture: '' }; // Empty string to clear the field
      
      this.teacherService.updateTeacher(this.teacherId, updateData).subscribe({
        next: (response: any) => {

          if (response.success) {
            // Optionally show success message

          }
        },
        error: (error: any) => {
          console.error('Failed to remove profile picture:', error);
        }
      });
    }
  }

  getFileName(fieldName: string): string {
    const file = this.teacherForm.get(fieldName)?.value;
    if (file && file instanceof File) {
      return file.name;
    }
    return '';
  }

  // Toggle section visibility
  toggleSection(section: string): void {
    switch (section) {
      case 'payroll':
        this.showPayrollDetails = !this.showPayrollDetails;
        break;
      case 'bank':
        this.showBankDetails = !this.showBankDetails;
        break;
      case 'social':
        this.showSocialMedia = !this.showSocialMedia;
        break;
      case 'documents':
        this.showDocuments = !this.showDocuments;
        break;
      case 'health':
        this.showHealthInfo = !this.showHealthInfo;
        break;
      case 'additional':
        this.showAdditionalInfo = !this.showAdditionalInfo;
        break;
    }
  }

  // Add language to languages_known array
  addLanguage(language: string): void {
    const currentLanguages = this.teacherForm.get('languages_known')?.value || [];
    if (!currentLanguages.includes(language)) {
      this.teacherForm.get('languages_known')?.setValue([...currentLanguages, language]);
    }
  }

  // Remove language from languages_known array
  removeLanguage(language: string): void {
    const currentLanguages = this.teacherForm.get('languages_known')?.value || [];
    const updatedLanguages = currentLanguages.filter((lang: string) => lang !== language);
    this.teacherForm.get('languages_known')?.setValue(updatedLanguages);
  }

  // Technical Skills management
  addTechnicalSkill(skill: string): void {
    const currentSkills = this.teacherForm.get('technical_skills')?.value || [];
    if (!currentSkills.includes(skill)) {
      this.teacherForm.get('technical_skills')?.setValue([...currentSkills, skill]);
    }
  }

  removeTechnicalSkill(skill: string): void {
    const currentSkills = this.teacherForm.get('technical_skills')?.value || [];
    const updatedSkills = currentSkills.filter((s: string) => s !== skill);
    this.teacherForm.get('technical_skills')?.setValue(updatedSkills);
  }

  // Soft Skills management
  addSoftSkill(skill: string): void {
    const currentSkills = this.teacherForm.get('soft_skills')?.value || [];
    if (!currentSkills.includes(skill)) {
      this.teacherForm.get('soft_skills')?.setValue([...currentSkills, skill]);
    }
  }

  removeSoftSkill(skill: string): void {
    const currentSkills = this.teacherForm.get('soft_skills')?.value || [];
    const updatedSkills = currentSkills.filter((s: string) => s !== skill);
    this.teacherForm.get('soft_skills')?.setValue(updatedSkills);
  }

  // Subject Expertise management
  addSubjectExpertise(subject: string): void {
    const currentSubjects = this.teacherForm.get('subject_expertise')?.value || [];
    if (!currentSubjects.includes(subject)) {
      this.teacherForm.get('subject_expertise')?.setValue([...currentSubjects, subject]);
    }
  }

  removeSubjectExpertise(subject: string): void {
    const currentSubjects = this.teacherForm.get('subject_expertise')?.value || [];
    const updatedSubjects = currentSubjects.filter((s: string) => s !== subject);
    this.teacherForm.get('subject_expertise')?.setValue(updatedSubjects);
  }

  // Teaching Methodologies management
  addTeachingMethodology(method: string): void {
    const currentMethods = this.teacherForm.get('teaching_methodologies')?.value || [];
    if (!currentMethods.includes(method)) {
      this.teacherForm.get('teaching_methodologies')?.setValue([...currentMethods, method]);
    }
  }

  removeTeachingMethodology(method: string): void {
    const currentMethods = this.teacherForm.get('teaching_methodologies')?.value || [];
    const updatedMethods = currentMethods.filter((m: string) => m !== method);
    this.teacherForm.get('teaching_methodologies')?.setValue(updatedMethods);
  }

  /**
   * Get full URL for image display
   */
  getFullImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a data URL (base64), return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // Remove storage/ prefix if it exists (we'll add it back)
    imagePath = imagePath.replace(/^storage\//, '');
    
    // Construct full URL - remove /api from base URL
    const baseUrl = environment.apiUrl.replace('/api', '');
    const fullUrl = `${baseUrl}/storage/${imagePath}`;
    
    return fullUrl;
  }

  /**
   * Handle image preview error
   */
  onProfilePictureError(): void {
    this.profilePicturePreview = null;
  }

  // ✅ Setup listeners to auto-sync permanent address to current address
  private setupAddressSyncListeners(): void {
    // Listen to permanent address field changes
    const permanentFields = [
      'permanent_address',
      'permanent_city', 
      'permanent_state',
      'permanent_pincode',
      'permanent_country'
    ];
    
    permanentFields.forEach(field => {
      this.teacherForm.get(field)?.valueChanges.subscribe(value => {
        // Only copy if "Same as Permanent Address" is checked
        if (this.sameAsPermanentAddress) {
          const currentField = field.replace('permanent_', 'current_');
          this.teacherForm.get(currentField)?.setValue(value, { emitEvent: false });
        }
      });
    });
  }

  // Copy permanent address to current address (fields remain editable)
  onSameAsPermanentAddressChange(checked: boolean): void {
    this.sameAsPermanentAddress = checked;
    
    if (checked) {
      // Copy permanent address to current address
      const permanentAddress = this.teacherForm.get('permanent_address')?.value || '';
      const permanentCity = this.teacherForm.get('permanent_city')?.value || '';
      const permanentState = this.teacherForm.get('permanent_state')?.value || '';
      const permanentPincode = this.teacherForm.get('permanent_pincode')?.value || '';
      const permanentCountry = this.teacherForm.get('permanent_country')?.value || 'India';

      this.teacherForm.patchValue({
        current_address: permanentAddress,
        current_city: permanentCity,
        current_state: permanentState,
        current_pincode: permanentPincode,
        current_country: permanentCountry
      }, { emitEvent: false });

      // ✅ Fields remain ENABLED - user can still edit if needed
      // Auto-sync will continue as long as checkbox is checked
    }
    // No need to enable/disable - fields always stay enabled
  }
}
