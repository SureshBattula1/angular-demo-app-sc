import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { GroupService } from '../../services/group.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { StudentGroup, GroupMember } from '../../../../core/models/class-section.model';
import { Student } from '../../../../core/models/student.model';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';

@Component({
  selector: 'app-manage-members',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './manage-members.component.html',
  styleUrls: ['./manage-members.component.scss']
})
export class ManageMembersComponent implements OnInit {
  group: StudentGroup | null = null;
  members: GroupMember[] = [];
  studentsAvailable: Student[] = [];
  loading = false;
  loadingStudents = false;
  loadingGrades = false;
  loadingSections = false;
  adding = false;
  removingId: number | null = null;
  groupId!: number;
  selectedStudentId: number | null = null;
  studentSearchText = '';
  private selectedStudentLabel: string | null = null;
  selectedGrade: string | null = null;
  selectedSection: string | null = null;
  selectedRole: 'Member' | 'Leader' = 'Member';
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  gradeOptions: Array<{ value: string; label: string }> = [];
  sectionOptions: Array<{ value: string; label: string }> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private studentCrudService: StudentCrudService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.groupId = +params['id'];
        this.loadGroup();
      }
    });
  }

  loadGroup(): void {
    this.loading = true;
    this.groupService.getGroup(this.groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.group = response.data;
          this.members = response.data.members || [];
          if (this.group?.branch_id) {
            this.loadGradesForBranch(this.group.branch_id);
            this.loadStudentsForSelection();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.loading = false;
        this.router.navigate(['/groups']);
      }
    });
  }

  loadStudentsForSelection(): void {
    if (!this.group?.branch_id) return;

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    this.loadingStudents = true;
    const params: Record<string, unknown> = {
      branch_id: this.group.branch_id,
      per_page: 100,
      is_active: true,
      for_group_membership: 1
    };

    if (this.selectedGrade) {
      params['grade'] = this.selectedGrade;
    }
    if (this.selectedSection) {
      params['section'] = this.selectedSection;
    }

    const query = this.studentSearchText.trim();
    if (query.length > 0) {
      params['search'] = query;
    }

    this.studentCrudService.getStudents(params).subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.studentsAvailable = Array.isArray(data) ? data : (data.data || []);
        this.loadingStudents = false;
      },
      error: () => {
        this.studentsAvailable = [];
        this.loadingStudents = false;
      }
    });
  }

  private loadGradesForBranch(branchId: number): void {
    this.loadingGrades = true;
    this.gradeService.getGrades({ branch_id: branchId }).subscribe({
      next: (response) => {
        this.gradeOptions = (response.success && response.data)
          ? response.data
              .filter(g => g.is_active !== false)
              .map(g => ({ value: String(g.value), label: g.label || `Grade ${g.value}` }))
          : [];
        this.loadingGrades = false;
      },
      error: () => {
        this.gradeOptions = [];
        this.loadingGrades = false;
      }
    });
  }

  private loadSectionsForGrade(branchId: number, grade: string): void {
    this.loadingSections = true;
    this.sectionService.getSections({
      branch_id: branchId,
      grade_level: grade,
      per_page: 1000,
      is_active: true
    }).subscribe({
      next: (response: any) => {
        this.sectionOptions = (response.success && response.data)
          ? response.data
              .filter((s: any) => s.is_active !== false)
              .map((s: any) => ({ value: String(s.name), label: `${s.name}${s.code ? ' (' + s.code + ')' : ''}` }))
          : [];
        this.loadingSections = false;
      },
      error: () => {
        this.sectionOptions = [];
        this.loadingSections = false;
      }
    });
  }

  get studentsToAdd(): Student[] {
    if (!this.studentsAvailable.length) return [];
    const memberStudentIds = this.members.map(m => m.student_id);
    return this.studentsAvailable.filter(s => !memberStudentIds.includes(s.id));
  }

  /**
   * Available class/grade values for the currently-addable students.
   * Used to avoid showing classes/sections that have no remaining students.
   */
  get availableGrades(): string[] {
    return this.gradeOptions.map(g => g.value);
  }

  /**
   * Available sections based on selected grade (if any), for students remaining to add.
   */
  get availableSections(): string[] {
    return this.sectionOptions.map(s => s.value);
  }

  /**
   * Students shown in the autocomplete based on filters + search text.
   * (Capped for performance.)
   */
  get studentSearchResults(): Student[] {
    const query = this.studentSearchText.trim().toLowerCase();

    let list = this.studentsToAdd
      .filter(s => this.selectedGrade ? this.getStudentGradeValue(s) === String(this.selectedGrade) : true)
      .filter(s => this.selectedSection ? this.getStudentSectionValue(s) === this.selectedSection : true);

    if (query) {
      list = list.filter(s => {
        const label = this.getStudentLabel(s).toLowerCase();
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const admission = (s.admission_number || '').toLowerCase();
        const roll = (s.roll_number || '').toString().toLowerCase();
        return label.includes(query) || fullName.includes(query) || admission.includes(query) || roll.includes(query);
      });
    }

    // Cap to keep the dropdown responsive
    return list.slice(0, 50);
  }

  getMemberDisplayName(member: GroupMember): string {
    if (member.student) {
      return `${(member.student as any).first_name || ''} ${(member.student as any).last_name || ''}`.trim();
    }
    return `Student #${member.student_id}`;
  }

  getMemberMeta(member: GroupMember): string {
    const m = member as any;
    const gradeDisplay = m?.grade_label || (m?.grade ? 'Grade ' + m.grade : null) || m?.student?.grade_label || (m?.student?.grade ? 'Grade ' + m.student.grade : null);
    const sectionDisplay = m?.section ? 'Section ' + m.section : (m?.student?.section ? 'Section ' + m.student.section : null);
    let gradeSection = '';
    if (gradeDisplay && sectionDisplay) {
      gradeSection = gradeDisplay + ' - ' + sectionDisplay;
    } else if (gradeDisplay) {
      gradeSection = gradeDisplay;
    } else if (sectionDisplay) {
      gradeSection = sectionDisplay;
    }
    const joined = member.joined_date ? new Date(member.joined_date).toLocaleDateString() : '';
    if (gradeSection && joined) return `${gradeSection} | Joined: ${joined}`;
    if (gradeSection) return gradeSection;
    if (joined) return `Joined: ${joined}`;
    return '';
  }

  addMember(): void {
    if (!this.selectedStudentId || this.adding) return;
    this.adding = true;
    this.groupService.addMember(this.groupId, this.selectedStudentId, this.selectedRole).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Member added successfully');
          this.selectedStudentId = null;
          this.selectedStudentLabel = null;
          this.studentSearchText = '';
          this.selectedRole = 'Member';
          this.loadGroup();
          this.loadStudentsForSelection();
        }
        this.adding = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.adding = false;
      }
    });
  }

  removeMember(member: GroupMember): void {
    if (this.removingId !== null) return;
    if (!confirm(`Remove ${this.getMemberDisplayName(member)} from this group?`)) return;
    this.removingId = member.student_id;
    this.groupService.removeMember(this.groupId, member.student_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Member removed successfully');
          this.loadGroup();
          this.loadStudentsForSelection();
        }
        this.removingId = null;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.removingId = null;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/groups/view', this.groupId]);
  }

  onBackToList(): void {
    this.router.navigate(['/groups']);
  }

  getStudentLabel(student: Student): string {
    const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const extra = student.admission_number ? ` (${student.admission_number})` : '';
    return name ? `${name}${extra}` : `Student #${student.id}`;
  }

  getSectionLabelFromValue(sectionValue: string): string {
    if (!sectionValue) return '';
    return this.sectionOptions.find(s => s.value === sectionValue)?.label || sectionValue;
  }

  getGradeDisplayLabelFromValue(gradeValue: string): string {
    if (!gradeValue) return '';
    const fromApi = this.gradeOptions.find(g => g.value === gradeValue)?.label;
    if (fromApi) return fromApi;
    const asNumber = Number(gradeValue);
    if (!isNaN(asNumber)) {
      return `Grade ${gradeValue}`;
    }
    return gradeValue;
  }

  getStudentGradeDisplay(student: Student): string {
    const s = student as any;
    return (
      s?.grade_label ||
      s?.current_grade_label ||
      this.getGradeDisplayLabelFromValue(this.getStudentGradeValue(student))
    );
  }

  getStudentGradeSectionDisplay(student: Student): string {
    const gradeDisplay = this.getStudentGradeDisplay(student);
    const sectionValue = this.getStudentSectionValue(student);
    return sectionValue ? `${gradeDisplay} - ${sectionValue}` : gradeDisplay;
  }

  private getStudentGradeValue(student: Student): string {
    const s = student as any;
    const raw =
      s?.grade ??
      s?.current_grade ??
      s?.grade_level ??
      s?.class?.grade ??
      '';
    return raw !== null && raw !== undefined ? String(raw).trim() : '';
  }

  private getStudentSectionValue(student: Student): string {
    const s = student as any;
    const raw =
      s?.section ??
      s?.current_section ??
      s?.class?.section ??
      '';
    return raw !== null && raw !== undefined ? String(raw).trim() : '';
  }

  onGradeChange(): void {
    // Changing grade implies section/search must reset for consistent filtering.
    this.selectedSection = null;
    this.sectionOptions = [];
    this.selectedStudentId = null;
    this.selectedStudentLabel = null;
    this.studentSearchText = '';

    if (this.group?.branch_id && this.selectedGrade) {
      this.loadSectionsForGrade(this.group.branch_id, this.selectedGrade);
    }
    this.loadStudentsForSelection();
  }

  onSectionChange(): void {
    this.selectedStudentId = null;
    this.selectedStudentLabel = null;
    this.studentSearchText = '';
    this.loadStudentsForSelection();
  }

  onStudentSearchTextChange(text: string): void {
    const trimmed = text.trim();
    // If the user edits the text away from the last selected label, invalidate selection.
    if (!this.selectedStudentLabel || trimmed !== this.selectedStudentLabel) {
      this.selectedStudentId = null;
      this.selectedStudentLabel = null;
    }

    // Debounced API search for students by class/section/query
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadStudentsForSelection();
    }, 300);
  }

  onStudentAutocompleteSelected(event: any): void {
    const selectedLabel = event?.option?.value as string | undefined;
    if (!selectedLabel) return;

    const student = this.studentsToAdd.find(s => this.getStudentLabel(s) === selectedLabel);
    if (!student) return;

    this.selectedStudentId = student.id;
    this.selectedStudentLabel = selectedLabel;
  }
}
