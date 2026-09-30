export type AssignmentType = 'Homework' | 'Project' | 'Quiz' | 'Test' | 'Other';
export type AssignmentAudienceMode = 'all' | 'custom';
export type AssignmentStatus = 'Draft' | 'Published' | 'Due' | string;

export const ASSIGNMENT_TYPES: AssignmentType[] = [
  'Homework',
  'Project',
  'Quiz',
  'Test',
  'Other'
];

export interface AssignmentAttachment {
  id?: string | number;
  file_name: string;
  original_name?: string | null;
  file_path: string;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  attachment_type?: string;
}

export interface Assignment {
  id: string | number;
  title: string;
  description?: string | null;
  class_name?: string;
  grade?: string | null;
  section?: string;
  subject?: string;
  subject_id?: string | number;
  due_date?: string;
  submission_count?: number;
  recipient_count?: number;
  status?: AssignmentStatus;
  audience_mode?: AssignmentAudienceMode;
  is_published?: boolean;
  max_marks?: number | null;
  assignment_type?: AssignmentType | string;
  teacher_id?: string | number;
  created_by?: string | number;
  can_edit?: boolean;
  instructions?: string | null;
  attachments?: AssignmentAttachment[];
  published_at?: string | null;
  student_ids?: Array<string | number>;
  branch_id?: string | number;
  branch?: { id: string | number; name?: string; code?: string } | null;
}

export interface AssignmentListItem extends Assignment {
  class_display?: string;
  status_display?: string;
}

export interface CreateAssignmentPayload {
  branch_id?: string | number | null;
  grade: string;
  section: string;
  subject_id: string | number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  due_date: string;
  max_marks?: number | null;
  assignment_type?: AssignmentType | string;
  audience_mode: AssignmentAudienceMode;
  student_ids?: Array<string | number>;
  is_published?: boolean;
  attachments?: AssignmentAttachment[];
}

export interface UpdateAssignmentPayload {
  title: string;
  description?: string | null;
  instructions?: string | null;
  due_date: string;
  max_marks?: number | null;
  assignment_type?: AssignmentType | string;
  attachments?: AssignmentAttachment[];
  is_published?: boolean;
  notify?: boolean;
}

export interface EligibleStudent {
  id: string | number;
  user_id?: string | number;
  name: string;
  admission_number?: string | null;
}

export interface AssignmentRecipientPreview {
  students: number;
  teachers: number;
  admins: number;
}
