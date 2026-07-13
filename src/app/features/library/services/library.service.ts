import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { Book, BookIssue, BorrowerType } from '../../../core/models/book.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly ENDPOINT = '/books';

  constructor(private apiService: ApiService) {}

  getBooks(params?: Record<string, unknown>): Observable<ApiResponse<Book[]>> {
    return this.apiService.get<Book[]>(this.ENDPOINT, params);
  }

  getBook(id: string | number): Observable<ApiResponse<Book>> {
    return this.apiService.get<Book>(`${this.ENDPOINT}/${id}`);
  }

  createBook(bookData: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.apiService.post<Book>(this.ENDPOINT, bookData);
  }

  updateBook(id: string | number, bookData: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.apiService.put<Book>(`${this.ENDPOINT}/${id}`, bookData);
  }

  deleteBook(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.ENDPOINT}/${id}`);
  }

  /** Issue a book to a member (student or teacher). Due date optional (server default). */
  issueBook(bookId: string | number, memberId: string | number, borrowerType: BorrowerType, dueDate?: string): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`${this.ENDPOINT}/${bookId}/issue`, {
      member_id: memberId,
      borrower_type: borrowerType,
      ...(dueDate ? { due_date: dueDate } : {})
    });
  }

  returnBook(issueId: string | number, collectFine = true): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`/book-issues/${issueId}/return`, { collect_fine: collectFine });
  }

  getActiveIssues(params?: Record<string, unknown>): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>('/book-issues/active', params);
  }

  getOverdueIssues(params?: Record<string, unknown>): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>('/book-issues/overdue', params);
  }

  /** All library issues for a member (user id). Used by the student profile view. */
  getStudentIssues(studentId: string | number): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>(`/students/${studentId}/book-issues`);
  }

  /** Full borrowing history for one book (current holders + past loans). */
  getBookHistory(id: string | number): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>(`${this.ENDPOINT}/${id}/history`);
  }
}
