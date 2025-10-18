export interface Holiday {
  id: number;
  branch_id: number | null;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'National' | 'State' | 'School' | 'Optional' | 'Restricted';
  color?: string;
  is_recurring: boolean;
  academic_year?: string;
  is_active: boolean;
  created_by?: number;
  duration?: number;
  branch?: {
    id: number;
    name: string;
    code: string;
  };
  createdBy?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface HolidayFormData {
  branch_id: number | null;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: string;
  color?: string;
  is_recurring?: boolean;
  academic_year?: string;
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
  id: number;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  type: string;
  allDay: boolean;
}

