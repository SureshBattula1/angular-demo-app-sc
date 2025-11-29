import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface AdmissionApplication {
  id?: number;
  branch_id: number;
  application_number?: string;
  application_date: string;
  academic_year: string;
  applying_for_grade: string;
  applying_for_section?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  religion?: string;
  nationality?: string;
  category?: string;
  mother_tongue?: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  current_address: string;
  current_city: string;
  current_state: string;
  current_country?: string;
  current_pincode: string;
  permanent_address?: string;
  permanent_city?: string;
  permanent_state?: string;
  permanent_country?: string;
  permanent_pincode?: string;
  father_name: string;
  father_phone: string;
  father_email?: string;
  father_occupation?: string;
  father_qualification?: string;
  father_annual_income?: number;
  mother_name: string;
  mother_phone?: string;
  mother_email?: string;
  mother_occupation?: string;
  mother_qualification?: string;
  mother_annual_income?: number;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_address?: string;
  previous_school?: string;
  previous_grade?: string;
  previous_school_board?: string;
  previous_percentage?: number;
  transfer_certificate_number?: string;
  tc_date?: string;
  application_status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Admitted' | 'Waitlisted';
  application_fee_paid?: boolean;
  application_fee_amount?: number;
  application_fee_payment_date?: string;
  application_fee_receipt_number?: string;
  entrance_test_required?: boolean;
  entrance_test_date?: string;
  entrance_test_score?: number;
  entrance_test_result?: 'Pass' | 'Fail' | 'Pending';
  interview_required?: boolean;
  interview_date?: string;
  interview_score?: number;
  interview_result?: 'Pass' | 'Fail' | 'Pending';
  admission_decision?: 'Approved' | 'Rejected' | 'Waitlisted' | 'Pending';
  admission_decision_date?: string;
  admission_offer_letter?: string;
  admission_validity_date?: string;
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_payment_date?: string;
  admission_confirmed?: boolean;
  admission_confirmed_date?: string;
  student_id?: number;
  remarks?: string;
  documents?: any[];
  branch_name?: string;
  branch_code?: string;
  grade_label?: string;
  admission_number?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {
  private readonly ENDPOINT = '/admissions';

  constructor(private apiService: ApiService) {}

  /**
   * Get all admission applications with filters
   */
  getApplications(params?: any): Observable<ApiResponse<AdmissionApplication[]>> {
    return this.apiService.get<AdmissionApplication[]>(this.ENDPOINT, params);
  }

  /**
   * Get single admission application
   */
  getApplication(id: number): Observable<ApiResponse<AdmissionApplication>> {
    return this.apiService.get<AdmissionApplication>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new admission application
   */
  createApplication(data: Partial<AdmissionApplication>): Observable<ApiResponse<AdmissionApplication>> {
    return this.apiService.post<AdmissionApplication>(this.ENDPOINT, data);
  }

  /**
   * Update admission application
   */
  updateApplication(id: number, data: Partial<AdmissionApplication>): Observable<ApiResponse<AdmissionApplication>> {
    return this.apiService.put<AdmissionApplication>(`${this.ENDPOINT}/${id}`, data);
  }

  /**
   * Delete admission application
   */
  deleteApplication(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Update application status
   */
  updateStatus(id: number, status: string, remarks?: string): Observable<ApiResponse<AdmissionApplication>> {
    return this.apiService.post<AdmissionApplication>(`${this.ENDPOINT}/${id}/update-status`, {
      status,
      remarks
    });
  }

  /**
   * Export admission applications
   */
  exportApplications(params?: any): Observable<ApiResponse<AdmissionApplication[]>> {
    return this.apiService.get<AdmissionApplication[]>(`${this.ENDPOINT}/export`, params);
  }
}

