import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { ExamService, Exam } from '../../services/exam.service';
import { ExamTermService, ExamTerm } from '../../services/exam-term.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss']
})
export class ExamFormComponent implements OnInit {
  examForm!: FormGroup;
  isEditMode = false;
  saving = false;
  examId?: string;
  branches: any[] = [];
  examTerms: ExamTerm[] = [];

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private examTermService: ExamTermService,
    private branchService: BranchService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadExamTerms();
    
    // Watch for exam term changes and auto-populate branch and academic year
    this.setupExamTermWatcher();
    
    // Check if this is a view mode (read-only) from the URL
    const currentUrl = this.router.url;
    const isViewMode = currentUrl.includes('/view/');
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.examId = params['id'];
        this.isEditMode = !isViewMode;
        this.loadExam();
      } else {
        // Creating a new exam
        this.isEditMode = true;
      }
    });
  }

  setupExamTermWatcher(): void {
    this.examForm.get('exam_term_id')?.valueChanges.subscribe(termId => {
      // Only auto-populate when creating a new exam (not when editing)
      if (!this.examId) {
        if (termId) {
          // Exam term selected - auto-populate and disable branch
          const selectedTerm = this.examTerms.find(term => term.id === termId);
          if (selectedTerm) {
            this.examForm.patchValue({
              branch_id: selectedTerm.branch_id,
              academic_year: selectedTerm.academic_year
            }, { emitEvent: false });
            
            // Disable branch field since it's auto-populated from exam term
            this.examForm.get('branch_id')?.disable({ emitEvent: false });
          }
        } else {
          // No exam term selected (None) - reset and enable branch
          this.examForm.patchValue({
            branch_id: '',
            academic_year: ''
          }, { emitEvent: false });
          
          // Enable branch field so user can select manually
          this.examForm.get('branch_id')?.enable({ emitEvent: false });
        }
      }
    });
  }

  initForm(): void {
    this.examForm = this.fb.group({
      name: ['', Validators.required],
      exam_term_id: [null],
      branch_id: ['', Validators.required],
      academic_year: ['', Validators.required],
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

  loadExamTerms(): void {
    this.examTermService.getExamTerms().subscribe({
      next: (response) => {
        if (response.success) {
          this.examTerms = response.data || [];
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  loadExam(): void {
    if (!this.examId) return;
    
    this.examService.getExam(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.examForm.patchValue(response.data);
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  onSubmit(): void {
    if (this.examForm.invalid) return;

    this.saving = true;
    // Use getRawValue() to include disabled fields (like branch_id when exam term is selected)
    const formData = this.examForm.getRawValue();

    const request = this.examId
      ? this.examService.updateExam(this.examId!, formData)
      : this.examService.createExam(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess(`Exam ${this.examId ? 'updated' : 'created'} successfully`);
          this.router.navigate(['/exams'], { queryParams: { tab: 'exams' } });
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
    this.router.navigate(['/exams'], { queryParams: { tab: 'exams' } });
  }

  onEditMode(): void {
    if (this.examId) {
      this.router.navigate(['/exams/edit', this.examId]);
    }
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.name : '';
  }

  getTermName(termId: number): string {
    const term = this.examTerms.find(t => t.id === termId);
    return term ? term.name : '';
  }
}

