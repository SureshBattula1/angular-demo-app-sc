import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { TransportService } from '../../services/transport.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { RouteStop, TransportRoute } from '../../../../core/models/transport.model';

export interface AssignDialogData {
  route: TransportRoute;
  stops: RouteStop[];
}

interface StudentOption { userId: string | number; label: string; }

@Component({
  selector: 'app-assign-student-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './assign-student-dialog.component.html',
  styleUrls: ['./assign-student-dialog.component.scss']
})
export class AssignStudentDialogComponent {
  searchTerm = '';
  students: StudentOption[] = [];
  selectedStudentId: string | number | null = null;
  pickupStopId: string | number | null = null;
  dropStopId: string | number | null = null;
  monthlyFee: number | null = null;
  searching = false;
  submitting = false;

  constructor(
    private dialogRef: MatDialogRef<AssignStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignDialogData,
    private transport: TransportService,
    private studentService: StudentCrudService,
    private errorHandler: ErrorHandlerService
  ) {
    this.monthlyFee = Number(data.route?.fare) || null;
  }

  searchStudents(): void {
    const term = this.searchTerm.trim();
    if (term.length < 2) { return; }
    this.searching = true;
    this.selectedStudentId = null;
    this.studentService.getStudents({ search: term, per_page: 25 }).subscribe({
      next: (res) => {
        this.students = (res.data || []).map((s: any) => ({
          userId: s.user_id,
          label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() + (s.admission_number ? ` (${s.admission_number})` : '')
        })).filter((s: StudentOption) => s.userId != null);
        this.searching = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.searching = false; }
    });
  }

  assign(): void {
    if (!this.selectedStudentId) { return; }
    this.submitting = true;
    this.transport.assignStudent({
      student_id: this.selectedStudentId,
      route_id: this.data.route.id,
      pickup_stop_id: this.pickupStopId || undefined,
      drop_stop_id: this.dropStopId || undefined,
      monthly_fee: this.monthlyFee ?? 0
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) { this.errorHandler.showSuccess('Student assigned'); this.dialogRef.close(true); }
        else { this.errorHandler.showError(res.message || 'Failed to assign student'); }
      },
      error: (e) => { this.errorHandler.showError(e); this.submitting = false; }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
