/**
 * Server-side API interfaces for data table operations
 */

// Generic API Response
export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Pagination Request
export interface PaginationRequest {
  page: number;
  pageSize: number;
}

// Sorting Request
export interface SortRequest {
  field: string;
  direction: 'asc' | 'desc';
}

// Search Request
export interface SearchRequest {
  query?: string;
  filters?: { [key: string]: any };
}

// Combined Request for server-side operations
export interface ServerTableRequest {
  pagination: PaginationRequest;
  sort?: SortRequest;
  search?: SearchRequest;
}

// Student specific interfaces
export interface Student {
  id: string;
  name: string;
  avatar: string;
  class: string;
  dob: string;
  parentName: string;
  mobile: string;
  address: string;
  status?: 'active' | 'inactive' | 'alumni';
  gender?: 'male' | 'female' | 'other';
  admissionDate?: string;
  section?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentListRequest extends ServerTableRequest {
  // Additional student-specific filters can be added here
}

export interface StudentListResponse extends ApiResponse<Student> {
  // Additional student-specific response data can be added here
}

// Generic table state for managing server-side operations
export interface TableState {
  page: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  filters?: { [key: string]: any };
  loading: boolean;
}
