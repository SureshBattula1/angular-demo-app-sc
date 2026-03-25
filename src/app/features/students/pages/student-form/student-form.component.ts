import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { StudentCrudService } from '../../services/student-crud.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { AcademicYearService, AcademicYear } from '../../../settings/services/academic-year.service';
import { AcademicYearContextService } from '../../../../core/services/academic-year-context.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { Student } from '../../../../core/models/student.model';
import { Grade } from '../../../../core/models/grade.model';
import { Section } from '../../../../core/models/section.model';
import { UniversalAttachmentsComponent } from '../../../../shared/components/universal-attachments/universal-attachments.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, UniversalAttachmentsComponent],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss']
})
export class StudentFormComponent implements OnInit {
  @ViewChild(UniversalAttachmentsComponent) attachmentsComponent!: UniversalAttachmentsComponent;
  
  studentForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  studentId?: number;
  currentStudent?: Student;
  
  branches: any[] = [];
  grades: Grade[] = [];
  sections: Section[] = [];
  loadingGrades = false;
  loadingSections = false;
  academicYears: AcademicYear[] = [];
  loadingAcademicYears = false;
  
  // Profile picture
  profilePicturePreview: string | null = null;
  profilePictureFile: File | null = null;
  
  // For attachments - will be set after student is created/updated
  attachmentModuleId: number | null = null;
  
  // Form sections visibility
  showTransportDetails = false;
  showHostelDetails = false;
  showHealthInfo = false;
  showDocumentsInfo = false;
  showAdditionalInfo = false;
  showSiblingInfo = false;
  showScholarshipInfo = false;

  hidePassword = true;
  
  // Static dropdowns
  genders = ['Male', 'Female', 'Other'].map(g => ({ value: g, label: g }));
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }));
  categories = [
    'General',
    'SC (Scheduled Caste)',
    'ST (Scheduled Tribe)',
    'OBC (Other Backward Class)',
    'OBC-NCL (OBC Non-Creamy Layer)',
    'EWS (Economically Weaker Section)',
    'MBC (Most Backward Class)',
    'NT (Nomadic Tribes)',
    'DNT (De-Notified Tribes)',
    'SBC (Special Backward Class)',
    'SEBC (Socially and Educationally Backward Class)',
    'Minority',
    'PWD (Persons with Disabilities)',
    'Defense',
    'Freedom Fighter',
    'Sports Quota',
    'NRI (Non-Resident Indian)',
    'Foreign National',
    'Other'
  ].map(c => ({ value: c, label: c }));
  admissionTypes = ['Regular', 'Transfer', 'Readmission'];
  mediumOptions = ['English', 'Hindi', 'Regional Language', 'Bilingual'];
  visionOptions = ['Normal', 'Weak', 'Uses Glasses', 'Corrected'];
  hearingOptions = ['Normal', 'Weak', 'Uses Hearing Aid'];
  vaccinationStatus = ['Complete', 'Incomplete', 'Not Vaccinated'];
  economicStatus = ['BPL', 'APL', 'EWS', 'General'];
  concessionTypes = ['Merit Scholarship', 'Category-based', 'Economic Weaker Section', 'Sports Quota', 'Other'];
  schoolBoards = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'];
  
  // Language options
  languageOptions = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati',
    'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Nepali', 'Sanskrit'
  ];

  constructor(
    private fb: FormBuilder,
    private studentCrudService: StudentCrudService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private academicYearService: AcademicYearService,
    private academicYearContext: AcademicYearContextService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadAcademicYears();

    // Default academic year from global context (create mode only)
    this.academicYearContext.selectedYear$.pipe(take(1)).subscribe(y => {
      if (!this.isEditMode && y?.id != null) {
        this.studentForm.patchValue({ academic_year_id: y.id });
      }
    });

    // Setup dynamic grade/section loading based on branch + grade
    this.setupDynamicGradeAndSectionLoading();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.studentId = +params['id'];
        this.isEditMode = true;
        this.loadStudent(this.studentId);
      }
    });
  }

  /**
   * Setup listeners to reload grades/sections when branch/grade changes
   */
  private setupDynamicGradeAndSectionLoading(): void {
    // Branch -> load grades, clear grade+section (create mode only; edit keeps academic placement)
    this.studentForm.get('branch_id')?.valueChanges.subscribe((branchId: number | null) => {
      if (this.isEditMode) {
        if (branchId) {
          this.loadGradesForBranch(branchId);
        }
        return;
      }

      this.grades = [];
      this.sections = [];
      this.studentForm.patchValue({ grade: '', section: null }, { emitEvent: false });

      if (branchId) {
        this.loadGradesForBranch(branchId);
      } else {
        this.loadingGrades = false;
        this.loadingSections = false;
      }
    });

    // Grade -> load sections for current branch (create mode only)
    this.studentForm.get('grade')?.valueChanges.subscribe((grade: string) => {
      if (this.isEditMode) {
        return;
      }

      const branchId = this.studentForm.get('branch_id')?.value as number | null;

      this.sections = [];
      this.studentForm.patchValue({ section: null }, { emitEvent: false });

      if (branchId && grade) {
        this.loadSectionsByGradeAndBranch(grade, branchId);
      } else {
        this.loadingSections = false;
      }
    });
  }

  /** Label for grade in Academic Details when grade/section are read-only (edit mode). */
  getGradeDisplayLabel(): string {
    const v = this.studentForm.get('grade')?.value;
    if (v === null || v === undefined || v === '') {
      return '—';
    }
    const g = this.grades.find((x) => x.value === v);
    return g ? g.label : String(v);
  }

  /** Section text for read-only Academic Details. */
  getSectionDisplayLabel(): string {
    const s = this.studentForm.get('section')?.value;
    if (s === null || s === undefined || s === '') {
      return '—';
    }
    return String(s);
  }

  private initForm(): void {
    this.studentForm = this.fb.group({
      // User Details
      first_name: ['', [Validators.required, Validators.maxLength(255)]],
      last_name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      
      // Admission
      branch_id: [null, Validators.required],
      admission_number: ['', Validators.required],
      admission_date: [null, Validators.required],
      roll_number: [''],
      
      // Academic
      grade: ['', Validators.required],
      section: [null],
      academic_year_id: [null, Validators.required],
      stream: [null],
      
      // Personal
      date_of_birth: [null, Validators.required],
      gender: ['', Validators.required],
      blood_group: [null],
      religion: [''],
      category: [null],
      
      // Address
      current_address: ['', Validators.required],
      permanent_address: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['India'],
      pincode: ['', Validators.required],
      
      // Father
      father_name: ['', Validators.required],
      father_phone: ['', Validators.required],
      father_email: [''],
      father_occupation: [''],
      
      // Mother
      mother_name: ['', Validators.required],
      mother_phone: [''],
      mother_email: [''],
      mother_occupation: [''],
      
      // Guardian (if different)
      guardian_name: [''],
      guardian_phone: [''],
      
      // Emergency
      emergency_contact_name: ['', Validators.required],
      emergency_contact_phone: ['', Validators.required],
      emergency_contact_relation: [''],
      
      // Previous Education
      previous_school: [''],
      previous_grade: [''],
      
      // Medical & Health
      medical_history: [''],
      allergies: [''],
      medications: [''],
      height_cm: [null, [Validators.min(0), Validators.max(300)]],
      weight_kg: [null, [Validators.min(0), Validators.max(200)]],
      vision_status: ['Normal'],
      hearing_status: ['Normal'],
      chronic_conditions: [''],
      current_medications: [''],
      medical_insurance: [false],
      insurance_provider: [''],
      insurance_policy_number: [''],
      last_health_checkup: [''],
      family_doctor_name: [''],
      family_doctor_phone: [''],
      vaccination_status: ['Complete'],
      vaccination_records: [[]],
      special_needs: [false],
      special_needs_details: [''],
      
      // Identity Documents
      aadhaar_number: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      pen_number: [''], // Permanent Education Number
      birth_certificate_number: [''],
      passport_number: [''],
      passport_expiry: [null],
      student_id_card_number: [''],
      voter_id: [''],
      ration_card_number: [''],
      domicile_certificate_number: [''],
      income_certificate_number: [''],
      caste_certificate_number: [''],
      caste: [''],
      sub_caste: [''],
      
      // Enhanced Address
      current_district: [''],
      current_landmark: [''],
      permanent_district: [''],
      permanent_landmark: [''],
      correspondence_address: [''],
      
      // Sibling Information
      number_of_siblings: [0, [Validators.min(0), Validators.max(20)]],
      sibling_details: [[]],
      sibling_discount_applicable: [false],
      sibling_discount_percentage: [0],
      
      // Enhanced Parent Info
      father_qualification: [''],
      father_organization: [''],
      father_designation: [''],
      father_annual_income: [0, [Validators.min(0)]],
      father_aadhaar: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      
      mother_qualification: [''],
      mother_organization: [''],
      mother_designation: [''],
      mother_annual_income: [0, [Validators.min(0)]],
      mother_aadhaar: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      
      guardian_qualification: [''],
      guardian_occupation: [''],
      guardian_email: ['', Validators.email],
      guardian_address: [''],
      guardian_annual_income: [0, [Validators.min(0)]],
      
      // Transport Details
      transport_required: [false],
      transport_route: [''],
      pickup_point: [''],
      drop_point: [''],
      vehicle_number: [''],
      pickup_time: [''],
      drop_time: [''],
      transport_fee: [0, [Validators.min(0)]],
      
      // Hostel Details
      hostel_required: [false],
      hostel_name: [''],
      hostel_room_number: [''],
      hostel_fee: [0, [Validators.min(0)]],
      
      // Library
      library_card_number: [''],
      library_card_issue_date: [''],
      library_card_expiry_date: [''],
      
      // Enhanced Previous Education
      previous_school_board: [''],
      previous_school_address: [''],
      previous_school_phone: [''],
      previous_percentage: [null, [Validators.min(0), Validators.max(100)]],
      tc_number: [''],
      tc_date: [''],
      previous_student_id: [''],
      medium_of_instruction: ['English'],
      language_preferences: [[]],
      
      // Fee & Scholarship
      fee_concession_applicable: [false],
      concession_type: [''],
      concession_percentage: [0],
      scholarship_name: [''],
      scholarship_details: [''],
      economic_status: [''],
      family_annual_income: [0, [Validators.min(0)]],
      
      // Additional Information
      hobbies_interests: [[]],
      extra_curricular_activities: [[]],
      achievements: [[]],
      sports_participation: [[]],
      cultural_activities: [[]],
      behavior_records: [''],
      counselor_notes: [''],
      special_instructions: [''],
      
      // Admission & Leaving
      admission_type: ['Regular'],
      leaving_date: [''],
      leaving_reason: [''],
      tc_issued_number: [''],
      
      remarks: [''],
      
      // Profile picture
      profile_picture: [null]
    });
  }

  private loadAcademicYears(): void {
    this.loadingAcademicYears = true;
    this.academicYearService.getList({ include_past: 1, per_page: 100 }).subscribe({
      next: (response) => {
        this.loadingAcademicYears = false;
        if (response.success && response.data) {
          this.academicYears = response.data;
        } else {
          this.academicYears = [];
        }
      },
      error: () => {
        this.loadingAcademicYears = false;
        this.academicYears = [];
      }
    });
  }

  private loadStudent(id: number): void {
    this.isLoading = true;
    
    this.studentCrudService.getStudent(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentStudent = response.data;
          const student = response.data;
          // Patch without triggering dropdown cascades; we'll hydrate them below.
          // Also convert API date strings -> Date objects for datepickers.
          this.studentForm.patchValue(
            {
              ...student,
              admission_date: this.parseToDate((student as any).admission_date),
              date_of_birth: this.parseToDate((student as any).date_of_birth),
              passport_expiry: this.parseToDate((student as any).passport_expiry),
            },
            { emitEvent: false }
          );
          
          // Load profile picture preview if exists - convert path to full URL
          if (student.profile_picture) {
            this.profilePicturePreview = this.getFullImageUrl(student.profile_picture);
          }

          // Hydrate branch-scoped grade/section dropdowns for edit mode
          const branchId = (student as any).branch_id as number | null | undefined;
          const grade = (student as any).grade as string | null | undefined;
          const section = (student as any).section as string | null | undefined;
          if (branchId) {
            this.loadGradesForBranch(branchId, () => {
              this.studentForm.patchValue({ grade: grade || '' }, { emitEvent: false });
              if (grade) {
                this.loadSectionsByGradeAndBranch(grade, branchId, () => {
                  this.studentForm.patchValue({ section: section ?? null }, { emitEvent: false });
                });
              }
            });
          }
          
          // Remove password requirement for edit
          this.studentForm.get('password')?.clearValidators();
          this.studentForm.get('password')?.updateValueAndValidity();
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/students']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
          console.log('Branches loaded in student form:', this.branches.length);
        }
      },
      error: (error) => {
        console.error('Error loading branches in student form:', error);
        this.errorHandler.showError('Failed to load branches');
        this.branches = [];
      }
    });
  }

  /**
   * Load grades for a specific branch (branch-scoped master data)
   */
  private loadGradesForBranch(branchId: number, done?: () => void): void {
    this.loadingGrades = true;
    
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filter only active grades
          this.grades = response.data.filter(grade => grade.is_active);
        }
        this.loadingGrades = false;
        done?.();
      },
      error: (error) => {
        this.errorHandler.showError('Failed to load grades');
        this.grades = [];
        this.loadingGrades = false;
        done?.();
      }
    });
  }

  /**
   * Load sections filtered by grade and branch
   */
  private loadSectionsByGradeAndBranch(grade: string, branchId?: number, done?: () => void): void {
    this.loadingSections = true;
    
    const params: any = { grade_level: grade };
    if (branchId) {
      params.branch_id = branchId;
    }

    this.sectionService.getSections(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sections = response.data.filter((section: Section) => section.is_active);
        }
        this.loadingSections = false;
        done?.();
      },
      error: (error) => {
        this.sections = [];
        this.loadingSections = false;
        done?.();
      }
    });
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.markFormGroupTouched(this.studentForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData: any = { ...this.studentForm.value };

    // Datepickers: Date -> YYYY-MM-DD (API expects strings)
    formData.admission_date = this.formatDate(formData.admission_date);
    formData.date_of_birth = this.formatDate(formData.date_of_birth);
    formData.passport_expiry = this.formatDate(formData.passport_expiry);
    
    // Remove password if empty in edit mode
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }
    
    // Remove profile_picture File object if exists (already uploaded)
    if (formData.profile_picture instanceof File) {
      delete formData.profile_picture;
    }

    const request = this.isEditMode && this.studentId
      ? this.studentCrudService.updateStudent(this.studentId, formData)
      : this.studentCrudService.createStudent(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          // Get the student ID from response (backend returns student_id for create, id for update)
          const responseData = response.data as any;
          const newStudentId = !this.isEditMode 
            ? (responseData?.student_id || responseData?.id) 
            : this.studentId;
          
          if (!newStudentId) {
            this.isLoading = false;
            this.errorHandler.showError('Failed to get student ID from response');
            return;
          }
          
          // Set attachment module ID after student is created/updated
          this.attachmentModuleId = newStudentId;
          if (!this.isEditMode) {
            this.studentId = newStudentId;
          }
          
          // Upload profile picture if exists (for create mode)
          if (!this.isEditMode && this.profilePictureFile) {
            this.uploadProfilePictureForNewStudent(newStudentId);
            return; // Don't navigate yet, wait for upload
          }
          
          // For edit mode, upload profile picture if it was changed
          if (this.isEditMode && this.profilePictureFile) {
            this.uploadProfilePictureImmediately(this.profilePictureFile);
            // Continue to upload attachments even if profile picture upload is in progress
          }
          
          // Upload any pending attachments after a short delay to ensure component is ready
          setTimeout(() => {
            if (this.attachmentsComponent && this.attachmentModuleId) {
              // Update the component's moduleId if it wasn't set
              this.attachmentsComponent.moduleId = this.attachmentModuleId;
              this.attachmentsComponent.uploadPendingAttachments();
            }
          }, 500);
          
          this.isLoading = false;
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Student updated successfully' : 'Student created successfully'
          );
          this.router.navigate(['/students']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/students']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.studentForm.get(fieldName);
    
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
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      branch_id: 'Branch',
      admission_number: 'Admission Number',
      admission_date: 'Admission Date',
      grade: 'Grade',
      date_of_birth: 'Date of Birth',
      gender: 'Gender',
      current_address: 'Current Address',
      city: 'City',
      state: 'State',
      pincode: 'PIN Code',
      father_name: 'Father Name',
      father_phone: 'Father Phone',
      mother_name: 'Mother Name',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_phone: 'Emergency Contact Phone',
      academic_year_id: 'Academic Year'
    };
    return labels[fieldName] || fieldName;
  }

  private parseToDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      // Expecting YYYY-MM-DD from API; construct in local timezone without time shift.
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const dt = new Date(y, mo, d);
        return isNaN(dt.getTime()) ? null : dt;
      }
      const dt = new Date(value);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  }

  private formatDate(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (!(value instanceof Date)) return null;

    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Profile Picture Upload
   */
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
    
    // Upload immediately if we have a student ID (edit mode)
    if (this.isEditMode && this.studentId) {
      this.uploadProfilePictureImmediately(file);
    } else {
      // Create mode: store file, will upload after student is created
      this.studentForm.get('profile_picture')?.setValue(file);
      this.profilePictureFile = file; // Store for later upload
    }
  }

  uploadProfilePictureImmediately(file: File): void {
    this.isLoading = true;
    
    const uploadPath = `students/${this.studentId}/profile_picture`;
    
    this.fileUploadService.uploadFile(file, uploadPath).subscribe({
      next: (uploadResponse: any) => {
        this.isLoading = false;
        
        if (uploadResponse.success && uploadResponse.data?.file_path) {
          // Store the file path in the form
          this.studentForm.get('profile_picture')?.setValue(uploadResponse.data.file_path);
          // Use the file_url from the upload response for preview
          this.profilePicturePreview = uploadResponse.data.file_url || this.getFullImageUrl(uploadResponse.data.file_path);
          
          // Update student record with the new path
          const updateData: any = { profile_picture: uploadResponse.data.file_path };
          
          this.studentCrudService.updateStudent(this.studentId!, updateData).subscribe({
            next: (updateResponse: any) => {
              this.errorHandler.showSuccess('Profile picture uploaded successfully');
            },
            error: (error: any) => {
              console.error('Failed to update student with profile picture:', error);
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

  uploadProfilePictureForNewStudent(studentId: number): void {
    if (!this.profilePictureFile) {
      // No profile picture to upload, just handle attachments and navigate
      setTimeout(() => {
        if (this.attachmentsComponent && this.attachmentModuleId) {
          this.attachmentsComponent.moduleId = this.attachmentModuleId;
          this.attachmentsComponent.uploadPendingAttachments();
        }
      }, 500);
      this.errorHandler.showSuccess('Student created successfully');
      this.router.navigate(['/students']);
      return;
    }
    
    this.isLoading = true;
    const uploadPath = `students/${studentId}/profile_picture`;
    
    this.fileUploadService.uploadFile(this.profilePictureFile, uploadPath).subscribe({
      next: (uploadResponse: any) => {
        if (uploadResponse.success && uploadResponse.data?.file_path) {
          // Update student with profile picture path
          const updateData: any = { profile_picture: uploadResponse.data.file_path };
          
          this.studentCrudService.updateStudent(studentId, updateData).subscribe({
            next: (updateResponse: any) => {
              this.isLoading = false;
              
              // Upload any pending attachments after profile picture is saved
              setTimeout(() => {
                if (this.attachmentsComponent && this.attachmentModuleId) {
                  this.attachmentsComponent.moduleId = this.attachmentModuleId;
                  this.attachmentsComponent.uploadPendingAttachments();
                }
              }, 500);
              
              this.errorHandler.showSuccess('Student created successfully');
              this.router.navigate(['/students']);
            },
            error: (error: any) => {
              console.error('Failed to update student with profile picture:', error);
              this.isLoading = false;
              this.errorHandler.showWarning('Student created but profile picture update failed');
              
              // Still upload attachments and navigate
              setTimeout(() => {
                if (this.attachmentsComponent && this.attachmentModuleId) {
                  this.attachmentsComponent.moduleId = this.attachmentModuleId;
                  this.attachmentsComponent.uploadPendingAttachments();
                }
              }, 500);
              
              this.router.navigate(['/students']);
            }
          });
        } else {
          this.isLoading = false;
          this.errorHandler.showWarning('Student created but profile picture upload failed');
          
          // Still upload attachments and navigate
          setTimeout(() => {
            if (this.attachmentsComponent && this.attachmentModuleId) {
              this.attachmentsComponent.moduleId = this.attachmentModuleId;
              this.attachmentsComponent.uploadPendingAttachments();
            }
          }, 500);
          
          this.router.navigate(['/students']);
        }
      },
      error: (error: any) => {
        console.error('Profile picture upload error:', error);
        this.isLoading = false;
        this.errorHandler.showWarning('Student created but profile picture upload failed');
        
        // Still upload attachments and navigate
        setTimeout(() => {
          if (this.attachmentsComponent && this.attachmentModuleId) {
            this.attachmentsComponent.moduleId = this.attachmentModuleId;
            this.attachmentsComponent.uploadPendingAttachments();
          }
        }, 500);
        
        this.router.navigate(['/students']);
      }
    });
  }

  removeProfilePicture(): void {
    // Clear preview
    this.profilePicturePreview = null;
    
    // Clear form value (set to null to delete the image from database)
    this.studentForm.get('profile_picture')?.setValue(null);
    
    // If in edit mode, update student to remove profile picture
    if (this.isEditMode && this.studentId) {
      const updateData: any = { profile_picture: '' }; // Empty string to clear the field
      
      this.studentCrudService.updateStudent(this.studentId, updateData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.errorHandler.showSuccess('Profile picture removed');
          }
        },
        error: (error: any) => {
          console.error('Failed to remove profile picture:', error);
        }
      });
    }
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

  /**
   * Toggle section visibility
   */
  toggleSection(section: string): void {
    switch (section) {
      case 'transport':
        this.showTransportDetails = !this.showTransportDetails;
        break;
      case 'hostel':
        this.showHostelDetails = !this.showHostelDetails;
        break;
      case 'health':
        this.showHealthInfo = !this.showHealthInfo;
        break;
      case 'documents':
        this.showDocumentsInfo = !this.showDocumentsInfo;
        break;
      case 'additional':
        this.showAdditionalInfo = !this.showAdditionalInfo;
        break;
      case 'sibling':
        this.showSiblingInfo = !this.showSiblingInfo;
        break;
      case 'scholarship':
        this.showScholarshipInfo = !this.showScholarshipInfo;
        break;
    }
  }

  /**
   * Language management
   */
  addLanguage(language: string): void {
    const currentLanguages = this.studentForm.get('language_preferences')?.value || [];
    if (!currentLanguages.includes(language)) {
      this.studentForm.get('language_preferences')?.setValue([...currentLanguages, language]);
    }
  }

  removeLanguage(language: string): void {
    const currentLanguages = this.studentForm.get('language_preferences')?.value || [];
    const updatedLanguages = currentLanguages.filter((lang: string) => lang !== language);
    this.studentForm.get('language_preferences')?.setValue(updatedLanguages);
  }

  /**
   * Hobbies management
   */
  addHobby(hobby: string): void {
    const currentHobbies = this.studentForm.get('hobbies_interests')?.value || [];
    if (hobby && hobby.trim() && !currentHobbies.includes(hobby.trim())) {
      this.studentForm.get('hobbies_interests')?.setValue([...currentHobbies, hobby.trim()]);
    }
  }

  removeHobby(hobby: string): void {
    const currentHobbies = this.studentForm.get('hobbies_interests')?.value || [];
    const updated = currentHobbies.filter((h: string) => h !== hobby);
    this.studentForm.get('hobbies_interests')?.setValue(updated);
  }

  /**
   * Extra-curricular activities management
   */
  addActivity(activity: string): void {
    const currentActivities = this.studentForm.get('extra_curricular_activities')?.value || [];
    if (activity && activity.trim() && !currentActivities.includes(activity.trim())) {
      this.studentForm.get('extra_curricular_activities')?.setValue([...currentActivities, activity.trim()]);
    }
  }

  removeActivity(activity: string): void {
    const currentActivities = this.studentForm.get('extra_curricular_activities')?.value || [];
    const updated = currentActivities.filter((a: string) => a !== activity);
    this.studentForm.get('extra_curricular_activities')?.setValue(updated);
  }

  /**
   * Sports participation management
   */
  addSport(sport: string): void {
    const currentSports = this.studentForm.get('sports_participation')?.value || [];
    if (sport && sport.trim() && !currentSports.includes(sport.trim())) {
      this.studentForm.get('sports_participation')?.setValue([...currentSports, sport.trim()]);
    }
  }

  removeSport(sport: string): void {
    const currentSports = this.studentForm.get('sports_participation')?.value || [];
    const updated = currentSports.filter((s: string) => s !== sport);
    this.studentForm.get('sports_participation')?.setValue(updated);
  }
}



