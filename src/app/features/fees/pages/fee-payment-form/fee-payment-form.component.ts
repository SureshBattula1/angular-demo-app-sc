import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { FeeService } from '../../services/fee.service';
import { StudentCrudService } from '../../../students/services/student-crud.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-fee-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './fee-payment-form.component.html',
  styleUrls: ['./fee-payment-form.component.scss']
})
export class FeePaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  isLoading = false;
  
  students: any[] = [];
  feeStructures: any[] = [];
  selectedStudent: any = null;
  
  paymentMethods = [
    { value: 'Cash', label: 'Cash', icon: 'money' },
    { value: 'Card', label: 'Debit/Credit Card', icon: 'credit_card' },
    { value: 'Online', label: 'Online Transfer', icon: 'cloud_upload' },
    { value: 'Cheque', label: 'Cheque', icon: 'receipt' },
    { value: 'Other', label: 'Other', icon: 'more_horiz' }
  ];
  
  paymentStatuses = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Refunded', label: 'Refunded' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private feeService: FeeService,
    private studentService: StudentCrudService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadStudents();
  }
  
  initForm(): void {
    this.paymentForm = this.fb.group({
      student_id: [null, Validators.required],
      fee_structure_id: [null, Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0)]],
      payment_date: [this.getTodayDate(), Validators.required],
      payment_method: ['Cash', Validators.required],
      transaction_id: [''],
      discount_amount: [0, Validators.min(0)],
      late_fee: [0, Validators.min(0)],
      payment_status: ['Completed', Validators.required],
      remarks: ['']
    });
    
    // Watch for student selection to load their fee structures
    this.paymentForm.get('student_id')?.valueChanges.subscribe(studentId => {
      if (studentId) {
        this.loadStudentFeeStructures(studentId);
      }
    });
    
    // Auto-calculate total amount
    this.paymentForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }
  
  loadStudents(): void {
    this.studentService.getStudents({ student_status: 'Active' }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.students = response.data;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
      }
    });
  }
  
  loadStudentFeeStructures(studentId: string): void {
    this.isLoading = true;
    
    this.feeService.getStudentFees(studentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.feeStructures = response.data.pending_fees || [];
          this.selectedStudent = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
      }
    });
  }
  
  calculateTotal(): void {
    const amountPaid = this.paymentForm.get('amount_paid')?.value || 0;
    const lateFee = this.paymentForm.get('late_fee')?.value || 0;
    const discount = this.paymentForm.get('discount_amount')?.value || 0;
    
    const total = amountPaid + lateFee - discount;
    // Store calculated total (optional - can display in UI)
  }
  
  getTotalAmount(): number {
    const amountPaid = this.paymentForm.get('amount_paid')?.value || 0;
    const lateFee = this.paymentForm.get('late_fee')?.value || 0;
    const discount = this.paymentForm.get('discount_amount')?.value || 0;
    
    return amountPaid + lateFee - discount;
  }
  
  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched(this.paymentForm);
      this.errorHandler.showWarning('Please fill in all required fields');
      return;
    }
    
    this.isLoading = true;
    const formData = this.paymentForm.value;
    
    this.feeService.recordPayment(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.errorHandler.showSuccess('Payment recorded successfully');
          this.router.navigate(['/fees']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.showError(error);
      }
    });
  }
  
  onCancel(): void {
    this.router.navigate(['/fees']);
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
  
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  getStudentName(student: any): string {
    return `${student.first_name} ${student.last_name}`;
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.paymentForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['min'].min}`;
    }
    
    return '';
  }
  
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      student_id: 'Student',
      fee_structure_id: 'Fee Type',
      amount_paid: 'Amount',
      payment_date: 'Payment Date',
      payment_method: 'Payment Method',
      payment_status: 'Payment Status'
    };
    return labels[fieldName] || fieldName;
  }
}

