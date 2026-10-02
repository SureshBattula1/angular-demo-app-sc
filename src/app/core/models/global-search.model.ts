/**
 * A single person returned by the global search endpoint.
 * `type` drives which profile page the row links to; `category` is the
 * human-facing label (student | teacher | accountant | staff).
 */
export interface GlobalSearchResult {
  /** Opaque hashid string — never Number() it. */
  id: string;
  type: 'student' | 'teacher';
  category: 'student' | 'teacher' | 'accountant' | 'staff';
  name: string;
  email: string | null;
  phone: string | null;
  branch: {
    id: string | null;
    name: string | null;
    code: string | null;
  };
}
