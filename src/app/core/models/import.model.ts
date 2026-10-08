export interface ImportModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresContext: boolean;
  contextFields: string[];
  lastImport: string | null;
  totalRecords: number;
}

export interface ImportContext {
  branch_id: number | string;
  grade?: string;  // Required for students, not for teachers
  section?: string;  // Optional
  academic_year?: string;  // Required for students, not for teachers
}

export interface ImportBatch {
  batch_id: string;
  entity_type: string;
  file_name: string;
  file_size: number;
  status: ImportStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
}

export type ImportStatus = 'uploaded' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed' | 'cancelled';

export interface ValidationResult {
  batch_id: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  status: ImportStatus;
}

export interface ImportRecord {
  id: string;
  batch_id: string;
  row_number: number;
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors: string[] | null;
  validation_warnings: string[] | null;
  imported_to_production: boolean;
  [key: string]: any; // For dynamic fields
}

export interface ImportPreview {
  data: ImportRecord[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    imported: number;
  };
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ImportHistory {
  id: string;
  batch_id: string;
  entity_type: string;
  uploaded_by: number | string;
  branch_id: number | string | null;
  file_name: string;
  file_size: number;
  import_context: ImportContext | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
  status: ImportStatus;
  uploaded_at: string | null;
  validation_started_at: string | null;
  validation_completed_at: string | null;
  import_started_at: string | null;
  import_completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ImportCommitOptions {
  skip_invalid: boolean;
}

export interface ImportResult {
  batch_id: string;
  imported_count: number;
  failed_count: number;
  total_attempted: number;
  status: ImportStatus;
}

