import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import {
  Book,
  BookIssue,
  BorrowerType,
  LibraryDashboardSummary,
  CirculationTrend,
  LibraryCategory,
  LibraryAuthor,
  LibraryPublisher,
  LibrarySubject,
  LibraryBookCopy,
  LibraryShelf,
  LibraryStockVerification,
  LibraryMember,
  LibraryReservation,
  LibraryFine,
  LibraryProcurement
} from '../../../core/models/library.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly ENDPOINT = '/books';
  private readonly LIB_ENDPOINT = '/library';

  constructor(private apiService: ApiService) {}

  // ================= 1. DASHBOARD =================
  getDashboardSummary(params?: Record<string, unknown>): Observable<ApiResponse<LibraryDashboardSummary>> {
    return this.apiService.get<LibraryDashboardSummary>(`${this.LIB_ENDPOINT}/dashboard/summary`, params);
  }

  getCirculationTrends(params?: Record<string, unknown>): Observable<ApiResponse<CirculationTrend[]>> {
    return this.apiService.get<CirculationTrend[]>(`${this.LIB_ENDPOINT}/dashboard/trends`, params);
  }

  getPopularBooks(params?: Record<string, unknown>): Observable<ApiResponse<Book[]>> {
    return this.apiService.get<Book[]>(`${this.LIB_ENDPOINT}/dashboard/popular-books`, params);
  }

  // ================= 2. CATALOG: BOOKS (LEGACY & EXTENDED) =================
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

  getBookHistory(id: string | number): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>(`${this.ENDPOINT}/${id}/history`);
  }

  // ================= 2. CATALOG: MASTERS =================
  getCategories(params?: Record<string, unknown>): Observable<ApiResponse<LibraryCategory[]>> {
    return this.apiService.get<LibraryCategory[]>(`${this.LIB_ENDPOINT}/categories`, params);
  }

  createCategory(data: Partial<LibraryCategory>): Observable<ApiResponse<LibraryCategory>> {
    return this.apiService.post<LibraryCategory>(`${this.LIB_ENDPOINT}/categories`, data);
  }

  updateCategory(id: string | number, data: Partial<LibraryCategory>): Observable<ApiResponse<LibraryCategory>> {
    return this.apiService.put<LibraryCategory>(`${this.LIB_ENDPOINT}/categories/${id}`, data);
  }

  deleteCategory(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/categories/${id}`);
  }

  getAuthors(params?: Record<string, unknown>): Observable<ApiResponse<LibraryAuthor[]>> {
    return this.apiService.get<LibraryAuthor[]>(`${this.LIB_ENDPOINT}/authors`, params);
  }

  createAuthor(data: Partial<LibraryAuthor>): Observable<ApiResponse<LibraryAuthor>> {
    return this.apiService.post<LibraryAuthor>(`${this.LIB_ENDPOINT}/authors`, data);
  }

  updateAuthor(id: string | number, data: Partial<LibraryAuthor>): Observable<ApiResponse<LibraryAuthor>> {
    return this.apiService.put<LibraryAuthor>(`${this.LIB_ENDPOINT}/authors/${id}`, data);
  }

  deleteAuthor(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/authors/${id}`);
  }

  getPublishers(params?: Record<string, unknown>): Observable<ApiResponse<LibraryPublisher[]>> {
    return this.apiService.get<LibraryPublisher[]>(`${this.LIB_ENDPOINT}/publishers`, params);
  }

  createPublisher(data: Partial<LibraryPublisher>): Observable<ApiResponse<LibraryPublisher>> {
    return this.apiService.post<LibraryPublisher>(`${this.LIB_ENDPOINT}/publishers`, data);
  }

  updatePublisher(id: string | number, data: Partial<LibraryPublisher>): Observable<ApiResponse<LibraryPublisher>> {
    return this.apiService.put<LibraryPublisher>(`${this.LIB_ENDPOINT}/publishers/${id}`, data);
  }

  deletePublisher(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/publishers/${id}`);
  }

  getSubjects(params?: Record<string, unknown>): Observable<ApiResponse<LibrarySubject[]>> {
    return this.apiService.get<LibrarySubject[]>(`${this.LIB_ENDPOINT}/subjects`, params);
  }

  createSubject(data: Partial<LibrarySubject>): Observable<ApiResponse<LibrarySubject>> {
    return this.apiService.post<LibrarySubject>(`${this.LIB_ENDPOINT}/subjects`, data);
  }

  updateSubject(id: string | number, data: Partial<LibrarySubject>): Observable<ApiResponse<LibrarySubject>> {
    return this.apiService.put<LibrarySubject>(`${this.LIB_ENDPOINT}/subjects/${id}`, data);
  }

  deleteSubject(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/subjects/${id}`);
  }

  // ================= 3. INVENTORY: COPIES, SHELVES & STOCK VERIFICATION =================
  getCopies(params?: Record<string, unknown>): Observable<ApiResponse<LibraryBookCopy[]>> {
    return this.apiService.get<LibraryBookCopy[]>(`${this.LIB_ENDPOINT}/copies`, params);
  }

  createCopy(data: Partial<LibraryBookCopy>): Observable<ApiResponse<LibraryBookCopy>> {
    return this.apiService.post<LibraryBookCopy>(`${this.LIB_ENDPOINT}/copies`, data);
  }

  batchGenerateCopies(data: Record<string, unknown>): Observable<ApiResponse<LibraryBookCopy[]>> {
    return this.apiService.post<LibraryBookCopy[]>(`${this.LIB_ENDPOINT}/copies/batch-generate`, data);
  }

  updateCopy(id: string | number, data: Partial<LibraryBookCopy>): Observable<ApiResponse<LibraryBookCopy>> {
    return this.apiService.put<LibraryBookCopy>(`${this.LIB_ENDPOINT}/copies/${id}`, data);
  }

  deleteCopy(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/copies/${id}`);
  }

  getShelves(params?: Record<string, unknown>): Observable<ApiResponse<LibraryShelf[]>> {
    return this.apiService.get<LibraryShelf[]>(`${this.LIB_ENDPOINT}/shelves`, params);
  }

  createShelf(data: Partial<LibraryShelf>): Observable<ApiResponse<LibraryShelf>> {
    return this.apiService.post<LibraryShelf>(`${this.LIB_ENDPOINT}/shelves`, data);
  }

  updateShelf(id: string | number, data: Partial<LibraryShelf>): Observable<ApiResponse<LibraryShelf>> {
    return this.apiService.put<LibraryShelf>(`${this.LIB_ENDPOINT}/shelves/${id}`, data);
  }

  deleteShelf(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/shelves/${id}`);
  }

  getStockAudits(params?: Record<string, unknown>): Observable<ApiResponse<LibraryStockVerification[]>> {
    return this.apiService.get<LibraryStockVerification[]>(`${this.LIB_ENDPOINT}/stock-audits`, params);
  }

  startStockAudit(data: Record<string, unknown>): Observable<ApiResponse<LibraryStockVerification>> {
    return this.apiService.post<LibraryStockVerification>(`${this.LIB_ENDPOINT}/stock-audits/start`, data);
  }

  scanAuditBarcode(auditId: string | number, data: { barcode: string; shelf_id?: string | number }): Observable<ApiResponse> {
    return this.apiService.post(`${this.LIB_ENDPOINT}/stock-audits/${auditId}/scan`, data);
  }

  completeStockAudit(auditId: string | number): Observable<ApiResponse<LibraryStockVerification>> {
    return this.apiService.post<LibraryStockVerification>(`${this.LIB_ENDPOINT}/stock-audits/${auditId}/complete`, {});
  }

  // ================= 4. MEMBERS =================
  getMembers(params?: Record<string, unknown>): Observable<ApiResponse<LibraryMember[]>> {
    return this.apiService.get<LibraryMember[]>(`${this.LIB_ENDPOINT}/members`, params);
  }

  getMemberProfile(id: string | number, role?: string): Observable<ApiResponse<any>> {
    const params = role ? { role } : undefined;
    return this.apiService.get<any>(`${this.LIB_ENDPOINT}/members/${id}`, params);
  }

  // ================= 5. CIRCULATION (FRONT DESK) =================
  issueBook(bookId: string | number, memberId: string | number, borrowerType: BorrowerType, dueDate?: string): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`${this.ENDPOINT}/${bookId}/issue`, {
      member_id: memberId,
      borrower_type: borrowerType,
      ...(dueDate ? { due_date: dueDate } : {})
    });
  }

  issueViaDesk(payload: {
    branch_id: string | number;
    member_id: string | number;
    borrower_type: BorrowerType;
    barcode?: string;
    book_id?: string | number;
    copy_id?: string | number;
    due_date?: string;
    remarks?: string;
  }): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`${this.LIB_ENDPOINT}/circulation/issue`, payload);
  }

  returnBook(issueId: string | number, collectFine = true): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`/book-issues/${issueId}/return`, { collect_fine: collectFine });
  }

  returnViaDesk(payload: {
    issue_id?: string | number;
    barcode?: string;
    return_date?: string;
    collect_fine?: boolean;
    copy_condition?: string;
    payment_method?: string;
    remarks?: string;
  }): Observable<ApiResponse<any>> {
    return this.apiService.post<any>(`${this.LIB_ENDPOINT}/circulation/return`, payload);
  }

  renewBook(issueId: string | number, additionalDays?: number): Observable<ApiResponse<BookIssue>> {
    return this.apiService.post<BookIssue>(`${this.LIB_ENDPOINT}/circulation/renew`, {
      issue_id: issueId,
      ...(additionalDays ? { additional_days: additionalDays } : {})
    });
  }

  getActiveIssues(params?: Record<string, unknown>): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>('/book-issues/active', params);
  }

  getOverdueIssues(params?: Record<string, unknown>): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>('/book-issues/overdue', params);
  }

  getOverdueDesk(params?: Record<string, unknown>): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`${this.LIB_ENDPOINT}/circulation/overdue`, params);
  }

  sendOverdueReminder(issueId: string | number): Observable<ApiResponse> {
    return this.apiService.post(`${this.LIB_ENDPOINT}/circulation/send-reminder`, { issue_id: issueId });
  }

  getStudentIssues(studentId: string | number): Observable<ApiResponse<BookIssue[]>> {
    return this.apiService.get<BookIssue[]>(`/students/${studentId}/book-issues`);
  }

  // ================= 6. RESERVATIONS =================
  getReservations(params?: Record<string, unknown>): Observable<ApiResponse<LibraryReservation[]>> {
    return this.apiService.get<LibraryReservation[]>(`${this.LIB_ENDPOINT}/reservations`, params);
  }

  createReservation(data: {
    branch_id: string | number;
    book_id: string | number;
    member_id: string | number;
    borrower_type: BorrowerType;
    notes?: string;
  }): Observable<ApiResponse<LibraryReservation>> {
    return this.apiService.post<LibraryReservation>(`${this.LIB_ENDPOINT}/reservations`, data);
  }

  cancelReservation(id: string | number): Observable<ApiResponse> {
    return this.apiService.delete(`${this.LIB_ENDPOINT}/reservations/${id}`);
  }

  fulfillReservation(id: string | number): Observable<ApiResponse> {
    return this.apiService.post(`${this.LIB_ENDPOINT}/reservations/${id}/fulfill`, {});
  }

  // ================= 7. FINES =================
  getFines(params?: Record<string, unknown>): Observable<ApiResponse<LibraryFine[]>> {
    return this.apiService.get<LibraryFine[]>(`${this.LIB_ENDPOINT}/fines`, params);
  }

  collectFine(id: string | number, data: {
    amount: number;
    payment_method: string;
    transaction_reference?: string;
  }): Observable<ApiResponse<LibraryFine>> {
    return this.apiService.post<LibraryFine>(`${this.LIB_ENDPOINT}/fines/${id}/collect`, data);
  }

  payFine(id: string | number, data: {
    amount: number;
    payment_method: string;
    transaction_reference?: string;
  }): Observable<ApiResponse<LibraryFine>> {
    return this.collectFine(id, data);
  }

  waiveFine(id: string | number, data: { waived_reason: string }): Observable<ApiResponse<LibraryFine>> {
    return this.apiService.post<LibraryFine>(`${this.LIB_ENDPOINT}/fines/${id}/waive`, data);
  }

  // ================= 8. PROCUREMENT =================
  getProcurements(params?: Record<string, unknown>): Observable<ApiResponse<LibraryProcurement[]>> {
    return this.apiService.get<LibraryProcurement[]>(`${this.LIB_ENDPOINT}/procurements`, params);
  }

  getProcurement(id: string | number): Observable<ApiResponse<LibraryProcurement>> {
    return this.apiService.get<LibraryProcurement>(`${this.LIB_ENDPOINT}/procurements/${id}`);
  }

  createProcurement(data: any): Observable<ApiResponse<LibraryProcurement>> {
    return this.apiService.post<LibraryProcurement>(`${this.LIB_ENDPOINT}/procurements`, data);
  }

  receiveProcurement(id: string | number, data?: { invoice_number?: string; shelf_id?: string | number }): Observable<ApiResponse<LibraryProcurement>> {
    return this.apiService.post<LibraryProcurement>(`${this.LIB_ENDPOINT}/procurements/${id}/receive`, data || {});
  }

  // ================= 9. REPORTS =================
  getCirculationReport(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.apiService.get<any>(`${this.LIB_ENDPOINT}/reports/circulation`, params);
  }

  getInventoryReport(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.apiService.get<any>(`${this.LIB_ENDPOINT}/reports/inventory`, params);
  }

  getFineReport(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.apiService.get<any>(`${this.LIB_ENDPOINT}/reports/fines`, params);
  }

  getFinesReport(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.getFineReport(params);
  }
}
