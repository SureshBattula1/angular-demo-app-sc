import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../shared/modules/material/material.module';
import { Student } from '../../../../../../core/models/student.model';
import { LeaveService } from '../../../../../leaves/services/leave.service';
import { Leave, LeaveSummary } from '../../../../../../core/models/leave.model';
import { ErrorHandlerService } from '../../../../../../core/services/error-handler.service';

@Component({
  selector: 'app-student-leaves',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './student-leaves.component.html',
  styleUrls: ['./student-leaves.component.scss']
})
export class StudentLeavesComponent implements OnInit, OnChanges {
  @Input() student?: Student;
  
  studentLeaves: Leave[] = [];
  leavesSummary?: LeaveSummary;
  isLoading = false;

  constructor(
    private leaveService: LeaveService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadLeavesData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.student?.user_id) {
      this.loadLeavesData();
    }
  }

  loadLeavesData(): void {
    if (!this.student || !this.student.user_id) {
      return;
    }
    
    this.isLoading = true;
    const userId = this.student.user_id || this.student.id;
    
    this.leaveService.getStudentLeaves(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.studentLeaves = response.data as Leave[] || [];
          this.leavesSummary = response.summary;
        } else {
          this.studentLeaves = [];
          this.leavesSummary = undefined;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leaves data:', error);
        if (error.status !== 404) {
          this.errorHandler.showError('Failed to load leave data');
        }
        this.studentLeaves = [];
        this.leavesSummary = undefined;
        this.isLoading = false;
      }
    });
  }

  getLeaveStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': '#ff9800',
      'Approved': '#4caf50',
      'Rejected': '#f44336',
      'Cancelled': '#9e9e9e'
    };
    return colors[status] || '#9e9e9e';
  }
}
