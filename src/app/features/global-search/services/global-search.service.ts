import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { GlobalSearchResult } from '../../../core/models/global-search.model';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private readonly ENDPOINT = '/global-search';

  constructor(private apiService: ApiService) {}

  /**
   * Search students + teachers/accountants/staff within the caller's
   * accessible branches. `params` carries { q, page, per_page }.
   */
  search(params: Record<string, unknown>): Observable<ApiResponse<GlobalSearchResult[]>> {
    return this.apiService.get<GlobalSearchResult[]>(this.ENDPOINT, params);
  }
}
