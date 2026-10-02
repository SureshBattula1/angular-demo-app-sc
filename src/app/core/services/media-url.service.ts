import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaUrlService {
  private readonly origin = environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  /**
   * Resolve a stored path or partial URL to a browser-loadable absolute URL.
   */
  resolve(path: string | null | undefined): string {
    if (path == null) {
      return '';
    }

    const raw = path.trim();
    if (!raw || raw.toLowerCase() === 'null') {
      return '';
    }

    if (
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('data:')
    ) {
      return raw;
    }

    const normalized = raw.replace(/^\/+/, '');
    if (normalized.startsWith('storage/')) {
      return `${this.origin}/${normalized}`;
    }
    if (normalized.startsWith('uploads/')) {
      return `${this.origin}/storage/${normalized}`;
    }

    return `${this.origin}/storage/${normalized}`;
  }
}
