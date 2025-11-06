import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamTermService, ExamTerm } from '../../services/exam-term.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-exam-term-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './exam-term-form.component.html',
  styleUrls: ['./exam-term-form.component.scss']
})
export class ExamTermFormComponent implements OnInit {
  termForm!: FormGroup;
  isEditMode = false;
  saving = false;
  termId: number | undefined = undefined;
  branches: any[] = [];
  returnTab?: string;

  constructor(
    private fb: FormBuilder,
    private examTermService: ExamTermService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    
    // Check if this is a view mode (read-only) from the URL
    const currentUrl = this.router.url;
    const isViewMode = currentUrl.includes('/view/');
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.termId = +params['id'];
        this.isEditMode = !isViewMode; // Only edit mode if NOT view mode
        this.loadTerm();
      }
    });
    
    // Capture returnTab from query parameters
    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'];
    });
  }

  initForm(): void {
    this.termForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      branch_id: ['', Validators.required],
      academic_year: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      weightage: [0],
      description: [''],
      is_active: [true]
    });
  }

  loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  loadTerm(): void {
    if (!this.termId) return;
    
    this.examTermService.getExamTerm(this.termId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.termForm.patchValue(response.data);
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  onSubmit(): void {
    if (this.termForm.invalid) return;

    this.saving = true;
    const formData = this.termForm.value;

    const request = this.isEditMode
      ? this.examTermService.updateExamTerm(this.termId!, formData)
      : this.examTermService.createExamTerm(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(`Exam term ${this.isEditMode ? 'updated' : 'created'} successfully`);
          this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
        }
        this.saving = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/exams'], { queryParams: { tab: this.returnTab } });
  }

  onEditMode(): void {
    if (this.termId) {
      this.router.navigate(['/exams/term/edit', this.termId], {
        queryParams: { returnTab: this.returnTab }
      });
    }
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.name : '';
  }
}

