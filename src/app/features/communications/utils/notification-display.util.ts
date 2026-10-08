import { AppNotification } from '../services/communication.service';

export function notificationIsUnread(item: AppNotification): boolean {
  return !item.is_read && !item.read_at;
}

export function notificationPreviewText(item: AppNotification): string {
  return item.message || item.description || '';
}

export function notificationDisplayDate(item: AppNotification): string {
  return item.date || item.sent_at || item.created_at || '';
}

export function notificationSourceLabel(item: AppNotification): string {
  const s = (item.source || item.type || 'info').toLowerCase();
  if (s === 'notification_campaign') {
    const module = (item.module || 'campaign').toLowerCase();
    return module.charAt(0).toUpperCase() + module.slice(1);
  }
  if (s === 'custom') return 'Message';
  if (s === 'assignment') return 'Assignment';
  if (s === 'attendance' || s === 'attendance_notify') return 'Attendance';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Info';
}

export function notificationSourceIcon(item: AppNotification): string {
  const s = (item.source || '').toLowerCase();
  if (s === 'notification_campaign') {
    const module = (item.module || '').toLowerCase();
    if (module === 'attendance') return 'fact_check';
    if (module === 'exams') return 'assignment';
    if (module === 'fees') return 'payments';
    if (module === 'holidays') return 'event';
    if (module === 'assignments') return 'assignment_turned_in';
    return 'campaign';
  }
  if (s === 'custom') return 'mail';
  if (s === 'assignment') return 'assignment';
  if (s === 'attendance' || s === 'attendance_notify') return 'fact_check';
  return 'notifications';
}

export type NotificationStatusTone = 'absent' | 'present' | 'leave' | 'neutral';

export function notificationIsCampaign(item: AppNotification): boolean {
  return (item.source || '').toLowerCase() === 'notification_campaign';
}

export function notificationStatusLabel(item: AppNotification): string {
  const key = (item.status_key || '').trim();
  if (key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  const parts = (item.title || '').split('·');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return '';
}

export function notificationStatusTone(item: AppNotification): NotificationStatusTone {
  const raw = `${item.status_key || ''} ${notificationStatusLabel(item)}`.toLowerCase();
  if (raw.includes('absent') || raw.includes('overdue')) return 'absent';
  if (raw.includes('present') || raw.includes('paid') || raw.includes('result')) return 'present';
  if (raw.includes('leave') || raw.includes('due') || raw.includes('scheduled')) return 'leave';
  return 'neutral';
}

export function notificationClassSectionLine(item: AppNotification): string {
  if (item.grade && item.section) {
    return `G${item.grade} · ${item.section}`;
  }
  const audience = (item.audience || '').trim();
  if (audience) {
    return audience.replace('Grade ', 'G').replace(' - ', ' · ');
  }
  return '';
}

/** Primary line for list rows — avoids repeating raw API title for campaigns. */
export function notificationListTitle(item: AppNotification): string {
  if (notificationIsCampaign(item)) {
    return notificationPreviewText(item);
  }
  return item.title || notificationPreviewText(item);
}

export function notificationListSubtitle(item: AppNotification): string {
  if (notificationIsCampaign(item)) {
    return '';
  }
  const preview = notificationPreviewText(item);
  if (preview && preview !== item.title) {
    return preview;
  }
  return '';
}

export type InboxFilterSlug =
  | 'all'
  | 'today'
  | 'unread'
  | 'attendance'
  | 'assignments'
  | 'exams'
  | 'fees'
  | 'holidays'
  | 'custom';

export interface InboxFilterChip {
  slug: InboxFilterSlug;
  label: string;
  icon: string;
}

export const INBOX_FILTER_CHIPS: InboxFilterChip[] = [
  { slug: 'all', label: 'All', icon: 'inbox' },
  { slug: 'today', label: 'Today', icon: 'today' },
  { slug: 'unread', label: 'Unread', icon: 'mark_email_unread' },
  { slug: 'attendance', label: 'Attendance', icon: 'fact_check' },
  { slug: 'assignments', label: 'Assignments', icon: 'assignment_turned_in' },
  { slug: 'exams', label: 'Exams', icon: 'assignment' },
  { slug: 'fees', label: 'Fees', icon: 'payments' },
  { slug: 'holidays', label: 'Holidays', icon: 'event' },
  { slug: 'custom', label: 'Others', icon: 'mail' }
];

export function inboxFilterLabel(slug: InboxFilterSlug): string {
  return INBOX_FILTER_CHIPS.find(c => c.slug === slug)?.label ?? 'All';
}

export function inboxFilterToParams(slug: InboxFilterSlug): Record<string, string> {
  switch (slug) {
    case 'today':
      return { status: 'all', period: 'today' };
    case 'unread':
      return { status: 'unread' };
    case 'attendance':
      return { status: 'all', module: 'attendance' };
    case 'assignments':
      return { status: 'all', module: 'assignments' };
    case 'exams':
      return { status: 'all', module: 'exams' };
    case 'fees':
      return { status: 'all', module: 'fees' };
    case 'holidays':
      return { status: 'all', module: 'holidays' };
    case 'custom':
      return { status: 'all', module: 'custom' };
    default:
      return { status: 'all' };
  }
}

export type NotificationCategoryFilter = 'all' | 'campaign' | 'message' | 'assignment' | 'attendance';

export function notificationCategorySource(filter: NotificationCategoryFilter): string | null {
  switch (filter) {
    case 'campaign':
      return 'notification_campaign';
    case 'message':
      return 'custom';
    case 'assignment':
      return 'assignment';
    case 'attendance':
      return 'attendance';
    default:
      return null;
  }
}

export type NotificationDateGroupKey = 'today' | 'yesterday' | 'week' | 'earlier';

export function notificationDateGroupKey(iso: string): NotificationDateGroupKey {
  if (!iso) {
    return 'earlier';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return 'earlier';
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  if (diffDays === 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return 'week';
  }
  return 'earlier';
}

export function notificationDateGroupLabel(key: NotificationDateGroupKey): string {
  switch (key) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'week':
      return 'This week';
    default:
      return 'Earlier';
  }
}

const DATE_GROUP_ORDER: NotificationDateGroupKey[] = ['today', 'yesterday', 'week', 'earlier'];

export function groupNotificationsByDate<T extends AppNotification>(
  items: T[],
  dateFn: (item: T) => string = item => notificationDisplayDate(item)
): { key: NotificationDateGroupKey; label: string; items: T[] }[] {
  const buckets = new Map<NotificationDateGroupKey, T[]>();
  for (const item of items) {
    const key = notificationDateGroupKey(dateFn(item));
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }
  return DATE_GROUP_ORDER.filter(k => (buckets.get(k)?.length ?? 0) > 0).map(key => ({
    key,
    label: notificationDateGroupLabel(key),
    items: buckets.get(key) ?? []
  }));
}

export function notificationModuleFilterLabel(module: string): string {
  const m = module.toLowerCase();
  if (m === 'fees') return 'Fees';
  if (m === 'exams') return 'Exams';
  if (m === 'attendance') return 'Attendance';
  if (m === 'holidays') return 'Holidays';
  if (m === 'assignments') return 'Assignments';
  return module.charAt(0).toUpperCase() + module.slice(1);
}

export function notificationRelativeTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
