import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import {
  ExamScheduleService,
  ExamScheduleBulkCreatePayload
} from '../../services/exam-schedule.service';
import { ExamService } from '../../services/exam.service';
import { BranchService } from '../../../branches/services/branch.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { SectionSubjectService } from '../../../subjects/services/section-subject.service';
import { TeacherService } from '../../../teachers/services/teacher.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-exam-schedule-group-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './exam-schedule-group-form.component.html',
  styleUrls: ['./exam-schedule-group-form.component.scss']
})
export class ExamScheduleGroupFormComponent implements OnInit {
  headerForm!: FormGroup;
  defaultsForm!: FormGroup;
  saving = false;
  loadingCurriculum = false;
  curriculumEmpty = false;
  returnTab = 'schedules';

  exams: any[] = [];
  branches: any[] = [];
  grades: any[] = [];
  sections: Section[] = [];
  teachers: any[] = [];
  loadingSections = false;

  selectedExam: any = null;

  constructor(
    private fb: FormBuilder,
    private examScheduleService: ExamScheduleService,
    private examService: ExamService,
    private branchService: BranchService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private sectionSubjectService: SectionSubjectService,
    private teacherService: TeacherService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadExams();
    this.loadBranches();

    this.route.queryParams.subscribe(params => {
      this.returnTab = params['returnTab'] || 'schedules';
      if (params['exam_id']) {
        this.headerForm.patchValue({ exam_id: params['exam_id'] }, { emitEvent: true });
      }
    });

    this.headerForm.get('exam_id')?.valueChanges.subscribe(examId => {
      if (examId) {
        this.onExamSelected(examId);
      } else {
        this.clearExamContext();
      }
    });

    this.headerForm.get('grade_level')?.valueChanges.subscribe(() => {
      this.headerForm.patchValue({ section_id: '' }, { emitEvent: false });
      this.clearSubjectRows();
      this.loadSectionsForGrade();
    });

    this.headerForm.get('section_id')?.valueChanges.subscribe(sectionId => {
      if (sectionId) {
        this.loadCurriculum(sectionId);
      } else {
        this.clearSubjectRows();
      }
    });
  }

  initForms(): void {
    this.headerForm = this.fb.group({
      exam_id: ['', Validators.required],
      branch_id: ['', Validators.required],
      grade_level: ['', Validators.required],
      section_id: ['', Validators.required],
      shared_instructions: ['']
    });

    this.defaultsForm = this.fb.group({
      exam_date: [''],
      start_time: [''],
      end_time: [''],
      duration: [''],
      total_marks: [''],
      passing_marks: [''],
      room_number: [''],
      invigilator_id: [null]
    });

    this.headerForm.addControl('subjectRows', this.fb.array([]));
  }

  get subjectRows(): FormArray {
    return this.headerForm.get('subjectRows') as FormArray;
  }

  private ensureSubjectRowsArray(): FormArray {
    let rows = this.headerForm.get('subjectRows') as FormArray | null;
    if (!rows) {
      rows = this.fb.array([]);
      this.headerForm.addControl('subjectRows', rows);
    }
    return rows;
  }

  loadExams(): void {
    this.examService.getExams({ per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.exams = response.data || [];
          const examId = this.headerForm.get('exam_id')?.value;
          if (examId) {
            this.onExamSelected(examId);
          }
        }
      },
      error: (error) => this.errorHandler.showError(error)
    });
  }

  loadBranches(): void {
    this.branchService.getBranches().subscribe({
      next: (response) => {
        if (response.success) {
          this.branches = response.data || [];
        }
      }
    });
  }

  onExamSelected(examId: string | number): void {
    const idStr = String(examId);
    const exam = this.exams.find(e => String(e.id) === idStr);
    const apply = (data: any) => {
      this.selectedExam = data;
      this.headerForm.patchValue({ branch_id: data.branch_id }, { emitEvent: false });
      this.headerForm.get('branch_id')?.disable({ emitEvent: false });
      this.gradeService.getGrades({ branch_id: data.branch_id }).subscribe({
        next: (res: any) => { this.grades = res.data || []; },
        error: () => { this.grades = []; }
      });
      this.teacherService.getTeachers({ branch_id: data.branch_id }).subscribe({
        next: (res: any) => {
          this.teachers = res.success && res.data ? res.data : [];
        },
        error: () => { this.teachers = []; }
      });
      this.loadSectionsForGrade();
    };

    if (exam?.branch_id) {
      apply(exam);
      return;
    }
    this.examService.getExam(idStr).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          apply(res.data);
        }
      }
    });
  }

  clearExamContext(): void {
    this.selectedExam = null;
    this.headerForm.get('branch_id')?.enable({ emitEvent: false });
    this.headerForm.patchValue({ branch_id: '', grade_level: '', section_id: '' }, { emitEvent: false });
    this.grades = [];
    this.sections = [];
    this.teachers = [];
    this.clearSubjectRows();
  }

  loadSectionsForGrade(): void {
    const gradeLevel = this.headerForm.get('grade_level')?.value;
    const branchId = this.headerForm.get('branch_id')?.value;
    if (!gradeLevel || !branchId) {
      this.sections = [];
      return;
    }
    this.loadingSections = true;
    this.sectionService.getSections({
      grade_level: gradeLevel,
      branch_id: branchId,
      per_page: 1000,
      is_active: true
    }).subscribe({
      next: (response) => {
        this.sections = (response.success && response.data)
          ? response.data.filter((s: Section) => s.is_active)
          : [];
        this.loadingSections = false;
      },
      error: () => {
        this.sections = [];
        this.loadingSections = false;
      }
    });
  }

  clearSubjectRows(): void {
    const rows = this.ensureSubjectRowsArray();
    while (rows.length) {
      rows.removeAt(0);
    }
    this.curriculumEmpty = false;
  }

  loadCurriculum(sectionId: string | number): void {
    if (!sectionId || !this.selectedExam) {
      return;
    }
    this.loadingCurriculum = true;
    this.curriculumEmpty = false;
    this.clearSubjectRows();

    const ayId = this.selectedExam.academic_year_id ?? null;
    const ayName = this.selectedExam.academic_year ?? undefined;

    this.sectionSubjectService.getSectionSubjects(sectionId, ayId, ayName).subscribe({
      next: (response) => {
        const data = response.data as { subjects?: unknown[] } | undefined;
        const assignments = data?.subjects ?? [];
        const rows = this.ensureSubjectRowsArray();

        (assignments as any[]).forEach((assignment: any) => {
          const subject = assignment.subject ?? {};
          const subjectId = assignment.subject_id ?? subject.id;
          if (!subjectId) {
            return;
          }
          rows.push(this.fb.group({
            included: [false],
            subject_id: [subjectId],
            subject_label: [`${subject.name || 'Subject'} (${subject.code || ''})`.trim()],
            exam_date: ['', Validators.required],
            start_time: ['', Validators.required],
            end_time: ['', Validators.required],
            duration: ['', Validators.required],
            total_marks: ['', Validators.required],
            passing_marks: ['', Validators.required],
            room_number: [''],
            invigilator_id: [null]
          }));
        });

        this.curriculumEmpty = rows.length === 0;
        this.loadingCurriculum = false;
      },
      error: (error) => {
        this.loadingCurriculum = false;
        this.curriculumEmpty = true;
        this.errorHandler.showError(error);
      }
    });
  }

  get includedCount(): number {
    return this.subjectRows.controls.filter(c => c.get('included')?.value).length;
  }

  get createButtonLabel(): string {
    const n = this.includedCount;
    if (n === 0) {
      return 'Create schedules';
    }
    if (n === 1) {
      return 'Create schedule';
    }
    return `Create ${n} schedules`;
  }

  toggleSelectAll(checked: boolean): void {
    this.subjectRows.controls.forEach(c => c.patchValue({ included: checked }));
  }

  applyDefaults(toAllRows: boolean): void {
    const d = this.defaultsForm.getRawValue();
    this.subjectRows.controls.forEach(control => {
      if (!toAllRows && !control.get('included')?.value) {
        return;
      }
      control.patchValue({
        exam_date: d.exam_date ? this.formatDate(d.exam_date) : control.get('exam_date')?.value,
        start_time: d.start_time || control.get('start_time')?.value,
        end_time: d.end_time || control.get('end_time')?.value,
        duration: d.duration !== '' && d.duration !== null ? d.duration : control.get('duration')?.value,
        total_marks: d.total_marks !== '' && d.total_marks !== null ? d.total_marks : control.get('total_marks')?.value,
        passing_marks: d.passing_marks !== '' && d.passing_marks !== null ? d.passing_marks : control.get('passing_marks')?.value,
        room_number: d.room_number || control.get('room_number')?.value,
        invigilator_id: d.invigilator_id ?? control.get('invigilator_id')?.value
      });
    });
  }

  rowControl(index: number): FormGroup {
    return this.subjectRows.at(index) as FormGroup;
  }

  isRowDisabled(index: number): boolean {
    return !this.rowControl(index).get('included')?.value;
  }

  getSectionName(): string {
    const sectionId = this.headerForm.get('section_id')?.value;
    const section = this.sections.find(s => String(s.id) === String(sectionId));
    return section?.name ?? '';
  }

  getBranchName(): string {
    const branchId = this.headerForm.get('branch_id')?.value;
    const branch = this.branches.find(b => String(b.id) === String(branchId));
    return branch?.name ?? '';
  }

  private formatDate(value: unknown): string {
    if (!value) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    const s = String(value);
    return s.length >= 10 ? s.substring(0, 10) : s;
  }

  private validateIncludedRows(): boolean {
    let valid = true;
    this.subjectRows.controls.forEach(control => {
      if (!control.get('included')?.value) {
        return;
      }
      ['exam_date', 'start_time', 'end_time', 'duration', 'total_marks', 'passing_marks'].forEach(key => {
        const c = control.get(key);
        if (c && c.invalid) {
          c.markAsTouched();
          valid = false;
        }
      });
    });
    return valid;
  }

  onSubmit(): void {
    if (this.headerForm.get('exam_id')?.invalid ||
        this.headerForm.get('grade_level')?.invalid ||
        this.headerForm.get('section_id')?.invalid) {
      this.headerForm.markAllAsTouched();
      return;
    }

    if (this.includedCount === 0) {
      this.errorHandler.showError({ message: 'Select at least one subject to schedule.' });
      return;
    }

    if (!this.validateIncludedRows()) {
      return;
    }

    const sectionName = this.getSectionName();
    if (!sectionName) {
      this.errorHandler.showError({ message: 'Invalid section selection.' });
      return;
    }

    const schedules = this.subjectRows.controls
      .filter(c => c.get('included')?.value)
      .map(c => {
        const v = c.getRawValue();
        return {
          subject_id: v.subject_id,
          exam_date: this.formatDate(v.exam_date),
          start_time: v.start_time,
          end_time: v.end_time,
          duration: v.duration,
          total_marks: Number(v.total_marks),
          passing_marks: v.passing_marks !== '' && v.passing_marks !== null ? Number(v.passing_marks) : null,
          room_number: v.room_number || null,
          invigilator_id: v.invigilator_id || null,
          instructions: (this.headerForm.get('shared_instructions')?.value as string)?.trim() || null
        };
      });

    const payload: ExamScheduleBulkCreatePayload = {
      exam_id: this.headerForm.get('exam_id')?.value,
      grade_level: this.headerForm.get('grade_level')?.value,
      section: sectionName,
      schedules
    };

    this.saving = true;
    this.examScheduleService.createSchedulesBulk(payload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const created = response.data.created?.length ?? 0;
          const skipped = response.data.skipped?.length ?? 0;
          let msg = `${created} schedule(s) created successfully.`;
          if (skipped > 0) {
            msg += ` ${skipped} skipped (already scheduled).`;
          }
          this.errorHandler.showSuccess(msg);
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

  goSingleCreate(): void {
    const examId = this.headerForm.get('exam_id')?.value;
    const queryParams: Record<string, string> = { returnTab: this.returnTab };
    if (examId) {
      queryParams['exam_id'] = examId;
    }
    this.router.navigate(['/exams/schedule/create'], { queryParams });
  }
}
