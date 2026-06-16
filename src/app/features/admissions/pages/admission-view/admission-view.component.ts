import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AdmissionService, AdmissionApplication } from '../../services/admission.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admission-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './admission-view.component.html',
  styleUrls: ['./admission-view.component.scss']
})
export class AdmissionViewComponent implements OnInit {
  application?: AdmissionApplication;
  isLoading = true;
  applicationId!: string;
  activeTabIndex = 0; // For mat-tab-group selectedIndex
  isEditMode = false; // Track if we're in edit mode (viewing existing application)
  branches: any[] = [];

  constructor(
    private admissionService: AdmissionService,
    private branchService: BranchService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.applicationId = params['id'];
        this.loadApplication();
      }
    });
  }

  loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = Array.isArray(response.data) ? response.data : [];
          this.applyBranchName();
        }
      },
      error: () => {
        this.branches = [];
      }
    });
  }

  loadApplication(): void {
    this.isLoading = true;
    
    this.admissionService.getApplication(this.applicationId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.application = response.data;
          this.applyBranchName();
          this.isEditMode = true; // We have an existing application
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
        this.router.navigate(['/admissions']);
      }
    });
  }

  private applyBranchName(): void {
    if (!this.application) return;

    // If API already provided a branch name, keep it.
    const anyApp = this.application as any;
    if (anyApp.branch_name) return;

    // Try to resolve from embedded object first, then from branch_id lookup.
    const embedded = anyApp.branch;
    if (embedded?.name || embedded?.code) {
      anyApp.branch_name = embedded.name || embedded.code;
      return;
    }

    const branchId = anyApp.branch_id;
    if (!branchId || !this.branches?.length) return;

    const b = this.branches.find(x => x?.id === branchId);
    if (b) {
      anyApp.branch_name = b.name || b.code;
    }
  }

  onEdit(): void {
    this.router.navigate(['/admissions/edit', this.applicationId]);
  }

  onBack(): void {
    this.router.navigate(['/admissions']);
  }

  onUpdateStatus(): void {
    if (!this.application) {
      this.errorHandler.showWarning('Application data not loaded.');
      return;
    }

    // Check if already converted
    if (this.application.student_id) {
      this.errorHandler.showWarning('This application has already been converted to a student.');
      this.router.navigate(['/students/view', this.application.student_id]);
      return;
    }

    // Show dialog to select new status
    const currentStatus = this.application.application_status;
    const statusOptions = ['Applied', 'Shortlisted', 'Rejected', 'Admitted', 'Waitlisted'];
    const selectedStatus = prompt(
      `Current Status: ${currentStatus}\n\nSelect new status:\n1. Applied\n2. Shortlisted\n3. Rejected\n4. Admitted\n5. Waitlisted\n\nEnter status name:`,
      'Admitted'
    );

    if (!selectedStatus) {
      return; // User cancelled
    }

    const newStatus = selectedStatus.trim();
    if (!statusOptions.includes(newStatus)) {
      this.errorHandler.showWarning(`Invalid status. Please select one of: ${statusOptions.join(', ')}`);
      return;
    }

    if (newStatus === currentStatus) {
      this.errorHandler.showSuccess('Status is already set to ' + currentStatus);
      return;
    }

    // Get remarks
    const remarks = prompt('Enter remarks (optional):', '') || '';

    // Update status
    this.isLoading = true;
    this.admissionService.updateStatus(this.applicationId, newStatus, remarks).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.application = response.data;
          this.errorHandler.showSuccess(`Application status updated to "${newStatus}" successfully!`);
          
          // If status is "Admitted", also update admission_decision to "Approved"
          if (newStatus === 'Admitted' && this.application.admission_decision !== 'Approved') {
            this.updateAdmissionDecision();
          } else {
            // Reload application to get latest data
            this.loadApplication();
          }
        } else {
          this.errorHandler.showWarning('Failed to update status. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Update Status Error:', error);
        const errorMessage = error?.error?.message || error?.message || 'Failed to update status. Please try again.';
        this.errorHandler.showWarning(errorMessage);
      }
    });
  }

  private updateAdmissionDecision(): void {
    // Update admission_decision to Approved
    const updateData: Partial<AdmissionApplication> = {
      admission_decision: 'Approved' as 'Approved',
      admission_decision_date: new Date().toISOString().split('T')[0]
    };

    this.admissionService.updateApplication(this.applicationId, updateData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.application = response.data;
          this.errorHandler.showSuccess('Admission decision updated to "Approved". You can now convert to student using the "Convert to Student" button.');
          // Reload application to get updated data
          this.loadApplication();
        } else {
          this.errorHandler.showWarning('Failed to update admission decision. Please try again.');
        }
      },
      error: (error) => {
        console.error('Update Admission Decision Error:', error);
        this.errorHandler.showWarning('Failed to update admission decision. Please try again.');
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Applied': 'primary',
      'Shortlisted': 'accent',
      'Rejected': 'warn',
      'Admitted': 'primary',
      'Waitlisted': 'accent'
    };
    return colors[status] || 'primary';
  }

  getFullName(): string {
    if (!this.application) return '';
    return `${this.application.first_name || ''} ${this.application.last_name || ''}`.trim();
  }

  onConvertToStudent(): void {
    if (!this.application) {
      this.errorHandler.showWarning('Application data not loaded.');
      return;
    }
    
    console.log('Convert to Student - Application:', this.application);
    console.log('Application ID:', this.applicationId);
    console.log('Status:', this.application.application_status);
    console.log('Decision:', this.application.admission_decision);
    console.log('Registration Fee Paid:', this.application.registration_fee_paid);
    console.log('Student ID:', this.application.student_id);
    
    // Check if already converted
    if (this.application.student_id) {
      this.errorHandler.showWarning('This application has already been converted to a student.');
      this.router.navigate(['/students/view', this.application.student_id]);
      return;
    }
    
    // Check status
    if (this.application.application_status !== 'Admitted' && this.application.admission_decision !== 'Approved') {
      this.errorHandler.showWarning(`Application must be approved/admitted before converting to student. Current status: ${this.application.application_status}, Decision: ${this.application.admission_decision || 'None'}`);
      return;
    }
    
    // Check registration fee
    if (!this.application.registration_fee_paid) {
      this.errorHandler.showWarning('Registration fee must be paid before converting to student.');
      return;
    }
    
    if (confirm('Are you sure you want to convert this application to a student? This action cannot be undone.')) {
      this.isLoading = true;
      console.log('Calling convertToStudent API with ID:', this.applicationId);
      
      this.admissionService.convertToStudent(this.applicationId).subscribe({
        next: (response) => {
          console.log('Convert to Student Response:', response);
          this.isLoading = false;
          
          if (response && response.success) {
            const data = response.data || {};
            const gradeSection = (data.grade || data.section) ? ` (Class ${data.grade || ''}${data.section ? '-' + data.section : ''})` : '';
            this.errorHandler.showSuccess(`Application converted to student successfully! User account created with Student role.${gradeSection}`);
            // Reload application to get updated data
            this.loadApplication();
            // Navigate to student view
            if (response.data && response.data.student_id) {
              setTimeout(() => {
                this.router.navigate(['/students/view', response.data.student_id]);
              }, 1500);
            } else {
              // If no student_id in response, try to get it from the reloaded application
              setTimeout(() => {
                if (this.application?.student_id) {
                  this.router.navigate(['/students/view', this.application.student_id]);
                }
              }, 2000);
            }
          } else {
            this.errorHandler.showWarning(response?.message || 'Failed to convert application to student.');
          }
        },
        error: (error) => {
          console.error('Convert to Student Error:', error);
          this.isLoading = false;
          let errorMessage = 'Failed to convert application to student. Please try again.';
          
          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          this.errorHandler.showWarning(errorMessage);
          console.error('Full error object:', JSON.stringify(error, null, 2));
        }
      });
    }
  }

  canConvertToStudent(): boolean {
    if (!this.application) return false;
    
    // Already converted
    if (this.application.student_id) return false;
    
    // Class (grade) is required for conversion
    if (!this.application.applying_for_grade?.trim()) return false;
    
    // Status check
    if (this.application.application_status !== 'Admitted' && this.application.admission_decision !== 'Approved') {
      return false;
    }
    
    // Registration fee check
    if (!this.application.registration_fee_paid) {
      return false;
    }
    
    return true;
  }

  onViewStudent(): void {
    if (this.application?.student_id) {
      this.router.navigate(['/students/view', this.application.student_id]);
    }
  }
}

