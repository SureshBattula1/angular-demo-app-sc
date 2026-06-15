import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/services/api.service';

export interface StudentMarksOverviewSummary {
  percentage: number;
  marks_obtained: number;
  total_marks: number;
  subjects_count: number;
}

export interface StudentMarksYearBreakdown extends StudentMarksOverviewSummary {
  academic_year_id?: number | null;
  academic_year_name: string;
}

export interface StudentMarksOverview {
  overall: StudentMarksOverviewSummary;
  current_year: StudentMarksOverviewSummary & {
    academic_year_id?: number | null;
    academic_year_name?: string | null;
  };
  by_year?: StudentMarksYearBreakdown[];
}

@Injectable({
  providedIn: 'root'
})
export class ExamMarkService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/exam-marks`;

  getStudentMarksOverview(studentId: number): Observable<ApiResponse<StudentMarksOverview>> {
    return this.http.get<ApiResponse<StudentMarksOverview>>(
      `${this.apiUrl}/student/${studentId}/overview`
    );
  }
}
