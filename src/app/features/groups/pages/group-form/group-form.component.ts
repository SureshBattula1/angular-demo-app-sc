import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { GroupService } from '../../services/group.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentGroup } from '../../../../core/models/class-section.model';
import { Branch } from '../../../../core/models/branch.model';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.scss']
})
export class GroupFormComponent implements OnInit {
  groupForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  groupId?: number;
  currentGroup?: StudentGroup;
  
  groupTypes = [
    { value: 'Academic', label: 'Academic', icon: 'school' },
    { value: 'Sports', label: 'Sports', icon: 'sports' },
    { value: 'Cultural', label: 'Cultural', icon: 'theater_comedy' },
    { value: 'Club', label: 'Club', icon: 'groups' }
  ];
  
  branches: any[] = [];

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService,
    private branchService: BranchService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.groupId = +params['id'];
        this.isEditMode = true;
        this.loadGroup(this.groupId);
      }
    });
  }

  private initForm(): void {
    this.groupForm = this.fb.group({
      branch_id: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      type: ['Academic', Validators.required],
      academic_year: ['2024-2025', [Validators.required, Validators.maxLength(20)]],
      description: [''],
      is_active: [true]
    });
  }

  private loadGroup(id: number): void {
    this.isLoading = true;
    
    this.groupService.getGroup(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentGroup = response.data;
          this.groupForm.patchValue(response.data);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/groups']);
      }
    });
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.groupForm.invalid) {
      this.markFormGroupTouched(this.groupForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    const formData = this.groupForm.value;

    const request = this.isEditMode && this.groupId
      ? this.groupService.updateGroup(this.groupId, formData)
      : this.groupService.createGroup(formData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess(
            this.isEditMode ? 'Group updated successfully' : 'Group created successfully'
          );
          this.router.navigate(['/groups']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/groups']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.groupForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      branch_id: 'Branch',
      name: 'Group Name',
      code: 'Group Code',
      type: 'Group Type',
      academic_year: 'Academic Year'
    };
    return labels[fieldName] || fieldName;
  }
}

