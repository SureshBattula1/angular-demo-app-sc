import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AssignmentService } from '../../services/assignment.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SubjectService } from '../../../subjects/services/subject.service';
import { SectionService } from '../../../sections/services/section.service';
import { BranchService } from '../../../branches/services/branch.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { MediaUrlService } from '../../../../core/services/media-url.service';
import { ImagePreviewService } from '../../../../shared/services/image-preview.service';
import {
  ASSIGNMENT_TYPES,
  AssignmentAttachment,
  AssignmentType,
  EligibleStudent
} from '../../../../core/models/assignment.model';
import { Branch } from '../../../../core/models/branch.model';

interface OptionItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-assignment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './assignment-form.component.html',
  styleUrls: ['./assignment-form.component.scss']
})
export class AssignmentFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private assignmentService = inject(AssignmentService);
  private gradeService = inject(GradeService);
  private subjectService = inject(SubjectService);
  private sectionService = inject(SectionService);
  private branchService = inject(BranchService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private fileUploadService = inject(FileUploadService);
  private mediaUrl = inject(MediaUrlService);
  private imagePreview = inject(ImagePreviewService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    branch_id: [''],
    grade: ['', Validators.required],
    section: ['', Validators.required],
    subject_id: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    instructions: [''],
    due_date: [new Date() as Date | null, Validators.required],
    max_marks: [20 as number | null],
    assignment_type: this.fb.nonNullable.control<AssignmentType>('Homework'),
    audience_mode: this.fb.nonNullable.control<'all' | 'custom'>('all'),
    is_published: this.fb.nonNullable.control(true)
  });

  assignmentId?: string;
  isEditMode = false;
  loading = false;
  submitting = false;
  uploading = false;
  loadingGrades = false;
  loadingSections = false;
  loadingSubjects = false;
  loadingStudents = false;
  showBranchSelector = false;

  assignmentTypes = ASSIGNMENT_TYPES;
  branches: Branch[] = [];
  grades: OptionItem[] = [];
  sections: OptionItem[] = [];
  subjects: OptionItem[] = [];
  students: EligibleStudent[] = [];
  selectedStudentIds = new Set<string>();
  attachments: AssignmentAttachment[] = [];
  recipientPreview: { students: number; teachers: number; admins: number } | null = null;
  minDueDate = new Date();

  private preview$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  private skipNextGradeChange = false;

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.assignmentId;
    this.minDueDate = this.isEditMode ? new Date(2000, 0, 1) : new Date();

    this.subscriptions.push(
      this.preview$.pipe(debounceTime(400)).subscribe(() => this.loadRecipientPreview())
    );
    this.subscriptions.push(
      this.form.controls.grade.valueChanges.subscribe(grade => {
        if (this.skipNextGradeChange) {
          this.skipNextGradeChange = false;
          return;
        }
        if (!this.isEditMode) {
          this.form.controls.section.setValue('');
          this.form.controls.subject_id.setValue('');
          this.sections = [];
          this.subjects = [];
          this.students = [];
          this.selectedStudentIds.clear();
        }
        if (grade) {
          this.loadSections(grade);
          this.loadSubjects(grade);
        }
        this.queuePreview();
      })
    );
    this.subscriptions.push(
      this.form.controls.section.valueChanges.subscribe(section => {
        if (!this.isEditMode) {
          this.students = [];
          this.selectedStudentIds.clear();
          if (section && this.form.controls.audience_mode.value === 'custom') {
            this.loadEligibleStudents();
          }
        }
        this.queuePreview();
      })
    );
    this.subscriptions.push(
      this.form.controls.audience_mode.valueChanges.subscribe(mode => {
        if (!this.isEditMode && mode === 'custom' && this.form.controls.grade.value && this.form.controls.section.value) {
          this.loadEligibleStudents();
        }
        this.queuePreview();
      })
    );
    this.subscriptions.push(
      this.form.controls.branch_id.valueChanges.subscribe(() => {
        if (!this.isEditMode) {
          const grade = this.form.controls.grade.value;
          this.form.controls.section.setValue('');
          this.sections = [];
          this.students = [];
          this.selectedStudentIds.clear();
          this.loadGrades();
          if (grade) {
            this.loadSections(grade);
            this.loadSubjects(grade);
          }
        }
        this.queuePreview();
      })
    );

    this.loadBranches();
    this.loadGrades();

    if (this.isEditMode && this.assignmentId) {
      this.lockTargetingFields();
      this.loadAssignment(this.assignmentId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Assignment' : 'Create Assignment';
  }

  get pageSubtitle(): string {
    return this.isEditMode
      ? 'Update homework details, due date, and attachments'
      : 'Publish homework to a class, the same way as the mobile app';
  }

  isStudentSelected(id: string | number): boolean {
    return this.selectedStudentIds.has(String(id));
  }

  toggleStudent(id: string | number, checked: boolean): void {
    const key = String(id);
    if (checked) {
      this.selectedStudentIds.add(key);
    } else {
      this.selectedStudentIds.delete(key);
    }
    this.queuePreview();
  }

  selectAllStudents(checked: boolean): void {
    this.selectedStudentIds.clear();
    if (checked) {
      this.students.forEach(student => this.selectedStudentIds.add(String(student.id)));
    }
    this.queuePreview();
  }

  attachmentName(file: AssignmentAttachment): string {
    return file.original_name || file.file_name || 'Attachment';
  }

  attachmentUrl(file: AssignmentAttachment): string {
    return this.mediaUrl.resolve(file.file_url || file.file_path);
  }

  isImageAttachment(file: AssignmentAttachment): boolean {
    const type = (file.file_type || '').toLowerCase();
    const name = this.attachmentName(file).toLowerCase();
    return type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(name);
  }

  previewAttachment(file: AssignmentAttachment): void {
    const url = this.attachmentUrl(file);
    if (!url) {
      return;
    }
    if (this.isImageAttachment(file)) {
      this.imagePreview.openImage(this.attachmentName(file), url);
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) {
      return;
    }
    this.uploading = true;
    let remaining = files.length;
    files.forEach(file => {
      const validation = this.fileUploadService.validateFile(file, 10, [
        'jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'
      ]);
      if (!validation.valid) {
        this.errorHandler.showError(validation.error || 'Invalid file');
        remaining -= 1;
        if (remaining <= 0) {
          this.uploading = false;
        }
        return;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uploadPath = `assignments/${Date.now()}_${safeName}`;
      this.fileUploadService.uploadFile(file, uploadPath).subscribe({
        next: response => {
          if (response.success && response.data) {
            this.attachments = [
              ...this.attachments,
              {
                file_path: response.data.file_path,
                file_url: response.data.file_url,
                file_name: response.data.file_name || file.name,
                original_name: file.name,
                file_type: response.data.file_type,
                file_size: response.data.file_size,
                attachment_type: 'document'
              }
            ];
          } else {
            this.errorHandler.showError(response.message || `Could not upload ${file.name}`);
          }
          remaining -= 1;
          if (remaining <= 0) {
            this.uploading = false;
          }
        },
        error: error => {
          this.errorHandler.showError(error);
          remaining -= 1;
          if (remaining <= 0) {
            this.uploading = false;
          }
        }
      });
    });
  }

  cancel(): void {
    if (this.assignmentId) {
      this.router.navigate(['/assignments/view', this.assignmentId]);
      return;
    }
    this.router.navigate(['/assignments']);
  }

  submit(): void {
    if (this.form.invalid || this.submitting || this.uploading) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.due_date) {
      return;
    }
    if (!this.isEditMode && value.audience_mode === 'custom' && this.selectedStudentIds.size === 0) {
      this.errorHandler.showError('Select at least one student for a custom audience.');
      return;
    }

    this.submitting = true;
    if (this.isEditMode && this.assignmentId) {
      this.assignmentService
        .updateAssignment(this.assignmentId, {
          title: (value.title || '').trim(),
          description: value.description?.trim() || null,
          instructions: value.instructions?.trim() || null,
          due_date: this.formatDate(value.due_date),
          max_marks: value.max_marks ?? null,
          assignment_type: value.assignment_type,
          attachments: this.attachments,
          is_published: value.is_published,
          notify: true
        })
        .subscribe({
          next: response => {
            this.submitting = false;
            this.errorHandler.showSuccess(response.message || 'Assignment updated');
            this.router.navigate(['/assignments/view', this.assignmentId]);
          },
          error: error => {
            this.submitting = false;
            this.errorHandler.showError(error);
          }
        });
      return;
    }

    this.assignmentService
      .createAssignment({
        branch_id: value.branch_id || null,
        grade: value.grade || '',
        section: value.section || '',
        subject_id: value.subject_id || '',
        title: (value.title || '').trim(),
        description: value.description?.trim() || null,
        instructions: value.instructions?.trim() || null,
        due_date: this.formatDate(value.due_date),
        max_marks: value.max_marks ?? null,
        assignment_type: value.assignment_type,
        audience_mode: value.audience_mode,
        student_ids: value.audience_mode === 'custom' ? Array.from(this.selectedStudentIds) : [],
        is_published: value.is_published,
        attachments: this.attachments
      })
      .subscribe({
        next: response => {
          this.submitting = false;
          this.errorHandler.showSuccess(response.message || 'Assignment created');
          const id = response.data?.id;
          this.router.navigate(id ? ['/assignments/view', id] : ['/assignments']);
        },
        error: error => {
          this.submitting = false;
          this.errorHandler.showError(error);
        }
      });
  }

  private loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: response => {
        this.branches = response.data || [];
        this.showBranchSelector = this.branches.length > 1;
        if (!this.isEditMode && !this.form.controls.branch_id.value) {
          const userBranch = this.authService.currentUser()?.branch_id;
          const match = this.branches.find(branch => String(branch.id) === String(userBranch));
          this.form.controls.branch_id.setValue(String(match?.id ?? this.branches[0]?.id ?? ''), { emitEvent: false });
        }
      },
      error: () => {}
    });
  }

  private loadGrades(): void {
    this.loadingGrades = true;
    const branchId = this.form.controls.branch_id.value;
    const params = branchId ? { branch_id: branchId } : undefined;
    this.gradeService.getGrades(params).subscribe({
      next: response => {
        this.grades = (response.data || []).map((grade: { value?: string; label?: string; name?: string }) => ({
          value: String(grade.value ?? grade.name ?? ''),
          label: String(grade.label ?? grade.name ?? grade.value ?? '')
        }));
        this.loadingGrades = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loadingGrades = false;
      }
    });
  }

  private loadSections(grade: string): void {
    this.loadingSections = true;
    const branchId = this.form.controls.branch_id.value;
    const params: Record<string, unknown> = {
      grade_level: grade,
      is_active: true,
      per_page: 1000
    };
    if (branchId) {
      params['branch_id'] = branchId;
    }
    this.sectionService.getSections(params).subscribe({
      next: (response) => {
        const rows = response.data || [];
        this.sections = rows
          .map(section => ({
            value: String(section.name ?? section.code ?? ''),
            label: String(section.name ?? section.code ?? '')
          }))
          .filter(option => !!option.value);
        this.loadingSections = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loadingSections = false;
      }
    });
  }

  private loadSubjects(grade: string): void {
    this.loadingSubjects = true;
    const branchId = this.form.controls.branch_id.value;
    const params: Record<string, unknown> = { grade_level: grade, per_page: 100 };
    if (branchId) {
      params['branch_id'] = branchId;
    }
    this.subjectService.getSubjects(params).subscribe({
      next: response => {
        this.subjects = (response.data || []).map(subject => ({
          value: String(subject.id),
          label: subject.code ? `${subject.name} (${subject.code})` : subject.name
        }));
        this.loadingSubjects = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loadingSubjects = false;
      }
    });
  }

  private loadEligibleStudents(): void {
    const grade = this.form.controls.grade.value;
    const section = this.form.controls.section.value;
    if (!grade || !section) {
      return;
    }
    this.loadingStudents = true;
    this.assignmentService
      .getEligibleStudents({
        grade,
        section,
        branch_id: this.form.controls.branch_id.value || null
      })
      .subscribe({
        next: response => {
          this.students = response.data || [];
          this.loadingStudents = false;
          this.queuePreview();
        },
        error: error => {
          this.errorHandler.showError(error);
          this.loadingStudents = false;
        }
      });
  }

  private loadAssignment(id: string): void {
    this.loading = true;
    this.assignmentService.getAssignment(id).subscribe({
      next: response => {
        const assignment = response.data;
        if (!assignment) {
          this.errorHandler.showError('Assignment not found');
          this.router.navigate(['/assignments']);
          return;
        }
        if (!assignment.can_edit) {
          this.errorHandler.showError('Only the teacher who created this assignment can update it.');
          this.router.navigate(['/assignments/view', id]);
          return;
        }
        this.skipNextGradeChange = true;
        if (assignment.grade) {
          this.loadSections(assignment.grade);
          this.loadSubjects(assignment.grade);
        }
        this.form.patchValue({
          grade: assignment.grade || '',
          section: assignment.section || '',
          subject_id: assignment.subject_id != null ? String(assignment.subject_id) : '',
          title: assignment.title,
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          due_date: this.parseDate(assignment.due_date),
          max_marks: assignment.max_marks ?? 20,
          assignment_type: (assignment.assignment_type as AssignmentType) || 'Homework',
          audience_mode: assignment.audience_mode === 'custom' ? 'custom' : 'all',
          is_published: assignment.is_published !== false
        });
        this.attachments = [...(assignment.attachments || [])];
        this.selectedStudentIds = new Set((assignment.student_ids || []).map(studentId => String(studentId)));
        this.loading = false;
      },
      error: error => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/assignments']);
      }
    });
  }

  private lockTargetingFields(): void {
    this.form.controls.branch_id.disable({ emitEvent: false });
    this.form.controls.grade.disable({ emitEvent: false });
    this.form.controls.section.disable({ emitEvent: false });
    this.form.controls.subject_id.disable({ emitEvent: false });
    this.form.controls.audience_mode.disable({ emitEvent: false });
  }

  private queuePreview(): void {
    if (this.isEditMode) {
      return;
    }
    this.preview$.next();
  }

  private loadRecipientPreview(): void {
    const grade = this.form.controls.grade.value;
    const section = this.form.controls.section.value;
    if (!grade || !section) {
      this.recipientPreview = null;
      return;
    }
    this.assignmentService
      .previewRecipients({
        grade,
        section,
        audience_mode: this.form.controls.audience_mode.value,
        student_ids:
          this.form.controls.audience_mode.value === 'custom'
            ? Array.from(this.selectedStudentIds)
            : [],
        branch_id: this.form.controls.branch_id.value || null
      })
      .subscribe({
        next: response => {
          this.recipientPreview = response.data || null;
        },
        error: () => {
          this.recipientPreview = null;
        }
      });
  }

  private formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
