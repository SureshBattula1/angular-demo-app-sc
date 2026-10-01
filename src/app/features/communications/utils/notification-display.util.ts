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
