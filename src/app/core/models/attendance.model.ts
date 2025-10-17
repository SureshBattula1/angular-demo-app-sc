export interface StudentAttendance {
  id?: number;
  student_id: number;
  branch_id: number;
  grade_level: string;
  section: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Sick Leave' | 'Leave';
  remarks?: string;
  marked_by?: string;
  academic_year: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields from API
  first_name?: string;
  last_name?: string;
  email?: string;
  admission_number?: string;
  grade?: string;
  roll_number?: string;
}

export interface TeacherAttendance {
  id?: number;
  teacher_id: number;
  branch_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields from API
  first_name?: string;
  last_name?: string;
  email?: string;
  employee_id?: string;
}

export interface AttendanceFilters {
  type?: 'student' | 'teacher';
  branch_id?: number;
  date?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
  grade?: string;
  section?: string;
  per_page?: number;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  leaves?: number;
  percentage: number;
}

export interface AttendanceReport {
  data: StudentAttendance[] | TeacherAttendance[];
  summary: AttendanceSummary;
  period?: {
    from: string;
    to: string;
  };
}

export interface BulkAttendanceItem {
  id: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Sick Leave' | 'Leave';
  remarks?: string;
  grade_level?: string;
  section?: string;
}

export interface BulkAttendanceRequest {
  type: 'student' | 'teacher';
  date: string;
  branch_id: number;
  academic_year?: string;
  attendance: BulkAttendanceItem[];
}

export interface AttendanceStudent {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
  roll_number: string;
  grade: string;
  section: string;
  status?: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Sick Leave' | 'Leave';
  remarks?: string;
}

