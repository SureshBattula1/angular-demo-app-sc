import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  category?: string;
  branch_id: number;
  total_copies: number;
  available_copies: number;
  price?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookIssue {
  id: number;
  book_id: number;
  student_id: number;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'Issued' | 'Returned' | 'Overdue';
  fine_amount?: number;
  book?: Book;
  student?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly ENDPOINT = '/books';

  constructor(private apiService: ApiService) {}

  /**
   * Get all books
   */
  getBooks(params?: Record<string, unknown>): Observable<ApiResponse<Book[]>> {
    return this.apiService.get<Book[]>(this.ENDPOINT, params);
  }

  /**
   * Get book by ID
   */
  getBook(id: number): Observable<ApiResponse<Book>> {
    return this.apiService.get<Book>(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Create new book
   */
  createBook(bookData: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.apiService.post<Book>(this.ENDPOINT, bookData);
  }

  /**
   * Update book
   */
  updateBook(id: number, bookData: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.apiService.put<Book>(`${this.ENDPOINT}/${id}`, bookData);
  }

  /**
   * Delete book
   */
  deleteBook(id: number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /**
   * Issue book to student
   */
  issueBook(bookId: number, studentId: number, dueDate: string): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`${this.ENDPOINT}/${bookId}/issue`, {
      student_id: studentId,
      due_date: dueDate
    });
  }

  /**
   * Return book
   */
  returnBook(issueId: number): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`/book-issues/${issueId}/return`, {});
  }

  /**
   * Get active book issues
   */
  getActiveIssues(params?: Record<string, unknown>): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>('/book-issues/active', params);
  }

  /**
   * Get overdue book issues
   */
  getOverdueIssues(params?: Record<string, unknown>): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>('/book-issues/overdue', params);
  }

  /**
   * Get student's book issues
   */
  getStudentIssues(studentId: number): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>(`/students/${studentId}/book-issues`);
  }
}

