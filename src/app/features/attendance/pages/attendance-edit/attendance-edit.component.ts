import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AttendanceService } from '../../services/attendance.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { StudentAttendance } from '../../../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './attendance-edit.component.html',
  styleUrls: ['./attendance-edit.component.scss']
})
export class AttendanceEditComponent implements OnInit {
  attendanceForm!: FormGroup;
  isLoading = false;
  attendanceId?: number;
  attendance?: StudentAttendance;
  
  statusOptions = [
    { value: 'Present', label: 'Present', icon: 'check_circle' },
    { value: 'Absent', label: 'Absent', icon: 'cancel' },
    { value: 'Late', label: 'Late', icon: 'schedule' },
    { value: 'Half-Day', label: 'Half Day', icon: 'timelapse' },
    { value: 'Sick Leave', label: 'Sick Leave', icon: 'local_hospital' },
    { value: 'Leave', label: 'Leave', icon: 'event_busy' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.attendanceId = +params['id'];
        this.loadAttendance();
      }
    });
  }
  
  private initForm(): void {
    this.attendanceForm = this.fb.group({
      status: ['', Validators.required],
      remarks: ['']
    });
  }
  
  loadAttendance(): void {
    if (!this.attendanceId) return;
    
    this.isLoading = true;
    
    this.attendanceService.getAttendanceById(this.attendanceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendance = response.data as StudentAttendance;
          this.attendanceForm.patchValue({
            status: this.attendance.status,
            remarks: this.attendance.remarks || ''
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/attendance']);
      }
    });
  }
  
  onSubmit(): void {
    if (this.attendanceForm.invalid || !this.attendanceId) {
      return;
    }
    
    this.isLoading = true;
    
    // Note: This will need backend API implementation
    this.errorHandler.showInfo('Update functionality requires backend API implementation');
    
    // TODO: Implement update API
    // const updateData = this.attendanceForm.value;
    // this.attendanceService.updateAttendance(this.attendanceId, updateData).subscribe({
    //   next: (response) => {
    //     this.errorHandler.showSuccess('Attendance updated successfully');
    //     this.router.navigate(['/attendance']);
    //   },
    //   error: (error) => {
    //     this.errorHandler.showError(error);
    //     this.isLoading = false;
    //   }
    // });
    
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  
  onCancel(): void {
    this.router.navigate(['/attendance']);
  }
}

