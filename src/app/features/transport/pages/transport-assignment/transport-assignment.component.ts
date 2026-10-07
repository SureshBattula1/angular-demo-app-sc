import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { GradeService } from '../../../grades/services/grade.service';
import { SectionService } from '../../../sections/services/section.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentTransport, TransportRoute, RouteStop } from '../../../../core/models/transport.model';

export interface StudentRosterItem {
  user_id: string | number;
  student_record_id?: string | number;
  full_name: string;
  admission_number?: string;
  roll_number?: string;
  class_name?: string;
  grade_value?: string;
  section_name?: string;
  is_assigned: boolean;
  assignment_id?: string | number | null;
  assigned_route_id?: string | number | null;
  assigned_route_name?: string | null;
  assigned_route_number?: string | null;
  assigned_stop_name?: string | null;
  annual_fee?: number | null;
  assignment_status?: string | null;
  selected?: boolean;
}

export interface ClassCardSummary {
  grade_value: string;
  label: string;
  total_students: number;
  assigned_count: number;
  unassigned_count: number;
  coverage_percent: number;
}

@Component({
  selector: 'app-transport-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './transport-assignment.component.html',
  styleUrls: ['./transport-assignment.component.scss']
})
export class TransportAssignmentComponent implements OnInit {
  // Top-level Navigation / View Mode
  activeView: 'workspace' | 'directory' = 'workspace';

  // Filters & State
  selectedGrade = ''; // Empty string = All Classes
  selectedSection = '';
  studentSearch = '';
  statusFilter: 'all' | 'unassigned' | 'assigned' = 'all';

  grades: { value: string; label: string }[] = [];
  sections: { value: string; label: string }[] = [];
  classCards: ClassCardSummary[] = [];
  allClassesSummary: ClassCardSummary = {
    grade_value: '',
    label: 'All Classes',
    total_students: 0,
    assigned_count: 0,
    unassigned_count: 0,
    coverage_percent: 0
  };

  // Student Roster
  allLoadedStudents: StudentRosterItem[] = [];
  displayedStudents: StudentRosterItem[] = [];
  loadingStudents = false;

  // Master Data
  routes: TransportRoute[] = [];
  assignments: StudentTransport[] = [];
  filteredAssignments: StudentTransport[] = [];
  loadingAssignments = false;
  assignmentSearch = '';

  // In-Screen Assignment Station (Right Panel)
  stationMode: 'bulk' | 'edit' = 'bulk';

  // --- Bulk Assign Form State ---
  targetRouteId: string | number | null = null;
  routeStops: RouteStop[] = [];
  targetPickupStopId: string | number | null = null;
  targetDropStopId: string | number | null = null;
  targetAnnualFee: number | null = null;
  targetDueDate: string | null = null;
  targetPickupTime: string | null = null;
  targetDropTime: string | null = null;
  submittingBulk = false;

  // --- In-Screen Edit Form State (NO MODAL) ---
  editingAssignmentId: string | number | null = null;
  editingStudentName = '';
  editingAdmissionNo = '';
  editingClassName = '';
  editRouteId: string | number | null = null;
  editRouteStops: RouteStop[] = [];
  editPickupStopId: string | number | null = null;
  editDropStopId: string | number | null = null;
  editAnnualFee: number | null = null;
  editDueDate: string | null = null;
  editPickupTime: string | null = null;
  editDropTime: string | null = null;
  editStatus: 'Active' | 'Inactive' = 'Active';
  savingEdit = false;

  // --- In-Screen Quick Unassign Banner (NO MODAL) ---
  unassignTarget: StudentTransport | StudentRosterItem | null = null;
  deletingAssignment = false;

  constructor(
    private transport: TransportService,
    private studentService: StudentCrudService,
    private gradeService: GradeService,
    private sectionService: SectionService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.loadGrades();
    this.loadSections();
    this.loadRoutes();
    this.loadAssignments();
  }

  // =========================================================================
  // 1. Data Loading & Initialization
  // =========================================================================
  loadGrades(): void {
    this.gradeService.getGrades().subscribe({
      next: (res) => {
        const raw = res.data || [];
        this.grades = raw.map((g: any) => ({
          value: g.value || g.name || '',
          label: g.label || g.name || ''
        }));
        this.recomputeClassSummaries();
      },
      error: () => { }
    });
  }

  loadSections(): void {
    this.sectionService.getSections({ is_active: true }).subscribe({
      next: (res) => {
        const raw = res.data || [];
        this.sections = raw.map((s) => ({ value: s.name, label: s.name }));
      },
      error: () => { }
    });
  }

  loadRoutes(): void {
    this.transport.getRoutes({ per_page: 100 }).subscribe({
      next: (res) => {
        this.routes = res.data || [];
      },
      error: () => { }
    });
  }

  loadAssignments(): void {
    this.loadingAssignments = true;
    this.transport.getAssignments({ per_page: 500 }).subscribe({
      next: (res) => {
        this.assignments = res.data || [];
        this.filterDirectoryAssignments();
        this.loadingAssignments = false;
        // Reload student roster to update assignment badges and class summaries
        this.loadStudents();
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loadingAssignments = false;
      }
    });
  }

  loadStudents(): void {
    this.loadingStudents = true;
    const params: Record<string, unknown> = {
      per_page: 500
    };
    if (this.selectedGrade) {
      params['grade'] = this.selectedGrade;
    }
    if (this.selectedSection) {
      params['section'] = this.selectedSection;
    }

    this.studentService.getStudents(params).subscribe({
      next: (res) => {
        const raw = res.data || [];
        this.allLoadedStudents = raw.map((item: any) => {
          const userId = item.user_id;
          const assigned = this.assignments.find((a) => a.student_id == userId);
          return {
            user_id: userId,
            student_record_id: item.id,
            full_name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Student',
            admission_number: item.admission_number,
            roll_number: item.roll_number,
            class_name: item.current_grade_label || item.current_grade || item.class_name,
            grade_value: item.current_grade || item.class_name,
            section_name: item.current_section || item.section_name,
            is_assigned: !!assigned,
            assignment_id: assigned?.id ?? null,
            assigned_route_id: assigned?.route_id ?? null,
            assigned_route_name: assigned?.route_name ?? null,
            assigned_route_number: assigned?.route_number ?? null,
            assigned_stop_name: assigned?.pickup_stop_name || assigned?.stop_name || null,
            annual_fee: assigned ? Number(assigned.annual_fee ?? assigned.monthly_fee ?? 0) : null,
            assignment_status: assigned?.status ?? null,
            selected: false
          };
        }).filter((s: StudentRosterItem) => s.user_id != null);

        this.recomputeClassSummaries();
        this.applyStudentFilters();
        this.loadingStudents = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loadingStudents = false;
      }
    });
  }

  // =========================================================================
  // 2. Class Summary Cards Computation
  // =========================================================================
  recomputeClassSummaries(): void {
    const totalStudents = this.allLoadedStudents.length;
    const totalAssigned = this.allLoadedStudents.filter((s) => s.is_assigned).length;
    const totalUnassigned = totalStudents - totalAssigned;

    this.allClassesSummary = {
      grade_value: '',
      label: 'All Classes',
      total_students: totalStudents,
      assigned_count: totalAssigned,
      unassigned_count: totalUnassigned,
      coverage_percent: totalStudents > 0 ? Math.round((totalAssigned / totalStudents) * 100) : 0
    };

    // Calculate per grade/class
    this.classCards = this.grades.map((g) => {
      const classStudents = this.allLoadedStudents.filter(
        (s) => s.grade_value === g.value || s.class_name === g.label || s.class_name === g.value
      );
      const assigned = classStudents.filter((s) => s.is_assigned).length;
      const count = classStudents.length;
      return {
        grade_value: g.value,
        label: g.label,
        total_students: count,
        assigned_count: assigned,
        unassigned_count: count - assigned,
        coverage_percent: count > 0 ? Math.round((assigned / count) * 100) : 0
      };
    });
  }

  selectClassCard(gradeValue: string): void {
    this.selectedGrade = gradeValue;
    this.selectedSection = '';
    this.applyStudentFilters();
  }

  selectSection(secValue: string): void {
    this.selectedSection = secValue;
    this.applyStudentFilters();
  }

  // =========================================================================
  // 3. Filter & Search Logic
  // =========================================================================
  applyStudentFilters(): void {
    let list = [...this.allLoadedStudents];

    // Filter by Class / Grade
    if (this.selectedGrade) {
      list = list.filter(
        (s) => s.grade_value === this.selectedGrade || s.class_name === this.selectedGrade
      );
    }

    // Filter by Section
    if (this.selectedSection) {
      list = list.filter((s) => s.section_name === this.selectedSection);
    }

    // Filter by Assignment Status
    if (this.statusFilter === 'unassigned') {
      list = list.filter((s) => !s.is_assigned);
    } else if (this.statusFilter === 'assigned') {
      list = list.filter((s) => s.is_assigned);
    }

    // Filter by Search Query
    const q = this.studentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.admission_number && s.admission_number.toLowerCase().includes(q)) ||
          (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
          (s.assigned_route_name && s.assigned_route_name.toLowerCase().includes(q)) ||
          (s.assigned_stop_name && s.assigned_stop_name.toLowerCase().includes(q))
      );
    }

    this.displayedStudents = list;
  }

  onSearchChange(): void {
    this.applyStudentFilters();
  }

  setStatusFilter(filter: 'all' | 'unassigned' | 'assigned'): void {
    this.statusFilter = filter;
    this.applyStudentFilters();
  }

  // =========================================================================
  // 4. Checklist & Student Selection
  // =========================================================================
  get unassignedInView(): StudentRosterItem[] {
    return this.displayedStudents.filter((s) => !s.is_assigned);
  }

  get selectedStudents(): StudentRosterItem[] {
    return this.displayedStudents.filter((s) => s.selected);
  }

  get selectedCount(): number {
    return this.selectedStudents.length;
  }

  get totalAnnualPlannedRevenue(): number {
    return this.selectedCount * (this.targetAnnualFee || 0);
  }

  isAllSelected(): boolean {
    const unassigned = this.unassignedInView;
    return unassigned.length > 0 && unassigned.every((s) => s.selected);
  }

  isPartiallySelected(): boolean {
    const unassigned = this.unassignedInView;
    const count = unassigned.filter((s) => s.selected).length;
    return count > 0 && count < unassigned.length;
  }

  toggleSelectAll(checked: boolean): void {
    // Only select/deselect UNASSIGNED students to avoid re-assigning taken students!
    this.unassignedInView.forEach((s) => (s.selected = checked));
  }

  toggleStudent(student: StudentRosterItem): void {
    if (student.is_assigned) {
      // Don't toggle assignment for already assigned student in bulk list
      return;
    }
    student.selected = !student.selected;
    if (student.selected && this.stationMode === 'edit') {
      this.stationMode = 'bulk';
    }
  }

  deselectAll(): void {
    this.displayedStudents.forEach((s) => (s.selected = false));
  }

  removeSelectedStudent(student: StudentRosterItem): void {
    student.selected = false;
  }

  // =========================================================================
  // 5. In-Screen Bulk Assignment Workspace (NO MODAL)
  // =========================================================================
  onRouteChange(routeId: string | number): void {
    const found = this.routes.find((r) => r.id === routeId);
    if (found) {
      this.targetAnnualFee = Number(found.fare) || null;
    }
    this.targetPickupStopId = null;
    this.targetDropStopId = null;
    this.routeStops = [];
    if (routeId) {
      this.transport.getRouteStops(routeId).subscribe({
        next: (res) => {
          this.routeStops = res.data || [];
          if (this.routeStops.length > 0) {
            this.targetPickupStopId = this.routeStops[0].id || null;
            this.targetDropStopId = this.routeStops[this.routeStops.length - 1].id || null;
            this.targetPickupTime = this.routeStops[0].pickup_time || null;
            this.targetDropTime = this.routeStops[this.routeStops.length - 1].drop_time || null;
          }
        },
        error: () => { }
      });
    }
  }

  onPickupStopChange(stopId: string | number | null): void {
    const stop = this.routeStops.find((s) => s.id === stopId);
    if (stop) {
      if (stop.pickup_time) {
        this.targetPickupTime = stop.pickup_time;
      }
      const stationFare = (stop as any).fare ?? (stop as any).station_fee;
      if (stationFare != null && !isNaN(Number(stationFare))) {
        this.targetAnnualFee = Number(stationFare);
      }
    }
  }

  onDropStopChange(stopId: string | number | null): void {
    const stop = this.routeStops.find((s) => s.id === stopId);
    if (stop && stop.drop_time) {
      this.targetDropTime = stop.drop_time;
    }
  }

  submitBulkAssignment(): void {
    const selectedIds = this.selectedStudents.map((s) => s.user_id);
    if (selectedIds.length === 0 || !this.targetRouteId) return;

    this.submittingBulk = true;
    this.transport.bulkAssign({
      student_ids: selectedIds,
      route_id: this.targetRouteId,
      pickup_stop_id: this.targetPickupStopId,
      drop_stop_id: this.targetDropStopId,
      annual_fee: this.targetAnnualFee ?? 0,
      monthly_fee: this.targetAnnualFee ?? 0,
      due_date: this.targetDueDate || null
    }).subscribe({
      next: (res) => {
        this.submittingBulk = false;
        if (res.success) {
          this.errorHandler.showSuccess(
            `Successfully assigned ${selectedIds.length} student(s) to transport with Annual Fee of ₹${this.targetAnnualFee || 0}/yr.`
          );
          this.deselectAll();
          this.loadAssignments();
        } else {
          this.errorHandler.showError(res.message || 'Bulk assignment failed');
        }
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.submittingBulk = false;
      }
    });
  }

  // =========================================================================
  // 6. In-Screen Single Student Quick Assign & Inline Edit (NO MODAL)
  // =========================================================================
  quickAssignStudent(student: StudentRosterItem): void {
    // Clear other selections and select only this student
    this.displayedStudents.forEach((s) => (s.selected = false));
    student.selected = true;
    this.stationMode = 'bulk';
    if (!this.targetRouteId && this.routes.length > 0) {
      this.targetRouteId = this.routes[0].id;
      this.onRouteChange(this.routes[0].id);
    }
  }

  openInScreenEdit(studentOrAssignment: StudentRosterItem | StudentTransport): void {
    this.stationMode = 'edit';
    let assignment: StudentTransport | undefined;

    if ('user_id' in studentOrAssignment) {
      // From student checklist
      this.editingStudentName = studentOrAssignment.full_name;
      this.editingAdmissionNo = studentOrAssignment.admission_number || '';
      this.editingClassName = studentOrAssignment.class_name || '';
      this.editingAssignmentId = studentOrAssignment.assignment_id || null;
      assignment = this.assignments.find((a) => a.id == studentOrAssignment.assignment_id);
    } else {
      // From directory table
      this.editingStudentName = studentOrAssignment.student_name || '';
      this.editingAdmissionNo = studentOrAssignment.admission_no || '';
      this.editingClassName = studentOrAssignment.class_name || '';
      this.editingAssignmentId = studentOrAssignment.id;
      assignment = studentOrAssignment;
    }

    if (assignment) {
      this.editRouteId = assignment.route_id;
      this.editPickupStopId = assignment.pickup_stop_id ?? null;
      this.editDropStopId = assignment.drop_stop_id ?? null;
      this.editAnnualFee = Number(assignment.annual_fee ?? assignment.monthly_fee ?? 0);
      this.editDueDate = assignment.due_date ? String(assignment.due_date).substring(0, 10) : null;
      this.editStatus = (assignment.status as 'Active' | 'Inactive') || 'Active';
      this.editPickupTime = assignment.pickup_time || null;
      this.editDropTime = assignment.drop_time || null;
      this.editRouteStops = [];

      if (this.editRouteId) {
        this.transport.getRouteStops(this.editRouteId).subscribe({
          next: (res) => (this.editRouteStops = res.data || []),
          error: () => { }
        });
      }
    }
  }

  onEditRouteChange(routeId: string | number): void {
    this.editPickupStopId = null;
    this.editDropStopId = null;
    this.editRouteStops = [];
    const r = this.routes.find((x) => x.id === routeId);
    if (r) {
      this.editAnnualFee = Number(r.fare) || null;
    }
    if (routeId) {
      this.transport.getRouteStops(routeId).subscribe({
        next: (res) => (this.editRouteStops = res.data || []),
        error: () => { }
      });
    }
  }

  onEditPickupStopChange(stopId: string | number | null): void {
    const stop = this.editRouteStops.find((s) => s.id === stopId);
    if (stop) {
      if (stop.pickup_time) {
        this.editPickupTime = stop.pickup_time;
      }
      const stationFare = (stop as any).fare ?? (stop as any).station_fee;
      if (stationFare != null && !isNaN(Number(stationFare))) {
        this.editAnnualFee = Number(stationFare);
      }
    }
  }

  cancelInScreenEdit(): void {
    this.stationMode = 'bulk';
    this.editingAssignmentId = null;
  }

  saveInScreenEdit(): void {
    if (!this.editingAssignmentId || !this.editRouteId) return;
    this.savingEdit = true;

    this.transport.updateAssignment(this.editingAssignmentId, {
      route_id: this.editRouteId,
      pickup_stop_id: this.editPickupStopId,
      drop_stop_id: this.editDropStopId,
      annual_fee: this.editAnnualFee ?? 0,
      monthly_fee: this.editAnnualFee ?? 0,
      due_date: this.editDueDate || null,
      status: this.editStatus
    }).subscribe({
      next: (res) => {
        this.savingEdit = false;
        if (res.success) {
          this.errorHandler.showSuccess('Transport assignment updated successfully');
          this.cancelInScreenEdit();
          this.loadAssignments();
        } else {
          this.errorHandler.showError(res.message || 'Failed to update assignment');
        }
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.savingEdit = false;
      }
    });
  }

  // =========================================================================
  // 7. In-Screen Quick Unassign (NO MODAL)
  // =========================================================================
  promptUnassign(target: StudentRosterItem | StudentTransport): void {
    this.unassignTarget = target;
  }

  cancelUnassign(): void {
    this.unassignTarget = null;
  }

  confirmUnassign(): void {
    if (!this.unassignTarget) return;

    let assignmentId: string | number | null = null;
    if ('user_id' in this.unassignTarget) {
      assignmentId = this.unassignTarget.assignment_id || null;
    } else {
      assignmentId = this.unassignTarget.id;
    }

    if (!assignmentId) return;

    this.deletingAssignment = true;
    this.transport.removeAssignment(assignmentId).subscribe({
      next: (res) => {
        this.deletingAssignment = false;
        if (res.success) {
          this.errorHandler.showSuccess('Transport assignment removed');
          this.unassignTarget = null;
          this.loadAssignments();
        } else {
          this.errorHandler.showError(res.message || 'Failed to remove assignment');
        }
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.deletingAssignment = false;
      }
    });
  }

  // =========================================================================
  // 8. Transport Directory Tab Filter
  // =========================================================================
  filterDirectoryAssignments(): void {
    const q = this.assignmentSearch.trim().toLowerCase();
    if (!q) {
      this.filteredAssignments = [...this.assignments];
      return;
    }
    this.filteredAssignments = this.assignments.filter(
      (a) =>
        (a.student_name && a.student_name.toLowerCase().includes(q)) ||
        (a.route_name && a.route_name.toLowerCase().includes(q)) ||
        (a.route_number && a.route_number.toLowerCase().includes(q)) ||
        (a.admission_no && a.admission_no.toLowerCase().includes(q)) ||
        (a.pickup_stop_name && a.pickup_stop_name.toLowerCase().includes(q)) ||
        (a.class_name && a.class_name.toLowerCase().includes(q))
    );
  }
}
