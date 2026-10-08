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
  attendanceId?: string;
  attendance?: StudentAttendance;
  returnTab: 'student' | 'teacher' = 'student'; // Store the tab to return to
  
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
        this.attendanceId = params['id'];
        
        // Capture the returnTab query param
        this.route.queryParams.subscribe(queryParams => {
          this.returnTab = queryParams['returnTab'] || 'student';
        });
        
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
        this.router.navigate(['/attendance'], {
          queryParams: { tab: this.returnTab }
        });
      }
    });
  }
  
  onSubmit(): void {
    if (this.attendanceForm.invalid || !this.attendanceId) {
      return;
    }
    
    this.isLoading = true;
    
    const updateData = this.attendanceForm.value;
    
    this.attendanceService.updateAttendance(this.attendanceId, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorHandler.showSuccess('Attendance updated successfully');
          this.router.navigate(['/attendance'], {
            queryParams: { tab: this.returnTab }
          });
        } else {
          this.errorHandler.showError(response.message || 'Failed to update attendance');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
      }
    });
  }
  
  onCancel(): void {
    // Navigate back with the tab that user was on
    this.router.navigate(['/attendance'], {
      queryParams: { tab: this.returnTab }
    });
  }
  
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Present': 'success',
      'Absent': 'danger',
      'Late': 'warning',
      'Half-Day': 'info',
      'Sick Leave': 'secondary',
      'Leave': 'secondary'
    };
    return colors[status] || 'default';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Present': 'check_circle',
      'Absent': 'cancel',
      'Late': 'schedule',
      'Half-Day': 'timelapse',
      'Sick Leave': 'local_hospital',
      'Leave': 'event_busy'
    };
    return icons[status] || 'info';
  }
  
  getSelectedStatusIcon(): string {
    const selectedValue = this.attendanceForm.get('status')?.value;
    if (!selectedValue) return 'info';
    
    const selectedOption = this.statusOptions.find(opt => opt.value === selectedValue);
    return selectedOption?.icon || 'info';
  }
  
  getSelectedStatusLabel(): string {
    const selectedValue = this.attendanceForm.get('status')?.value;
    if (!selectedValue) return 'Select status';
    
    const selectedOption = this.statusOptions.find(opt => opt.value === selectedValue);
    return selectedOption?.label || selectedValue;
  }
}


