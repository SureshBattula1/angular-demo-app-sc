export interface Holiday {
  id: string;
  branch_id: number | string | null;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'National' | 'State' | 'School' | 'Optional' | 'Restricted';
  color?: string;
  is_recurring: boolean;
  academic_year?: string;
  academic_year_id?: number | string | null;
  branch_name?: string;
  is_active: boolean;
  created_by?: number | string;
  duration?: number;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  createdBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface HolidayFormData {
  branch_id: number | string | null;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: string;
  color?: string;
  is_recurring?: boolean;
  academic_year_id?: number | string | null;
  is_active?: boolean;
}

export interface CalendarDay {
  date: Date;
  number: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holidays: Holiday[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  type: string;
  allDay: boolean;
}

