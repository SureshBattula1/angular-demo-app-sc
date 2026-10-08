export const SMS_TEMPLATE_MODULE_OPTIONS = [
  { value: 'holidays', label: 'Holidays', icon: 'event' },
  { value: 'exams', label: 'Exams', icon: 'assignment' },
  { value: 'attendance', label: 'Attendance', icon: 'fact_check' },
  { value: 'fees', label: 'Fees', icon: 'payments' },
  { value: 'assignments', label: 'Assignments', icon: 'assignment_turned_in' },
  { value: 'custom', label: 'Custom', icon: 'edit_note' }
] as const;

export type SmsTemplateModuleType = (typeof SMS_TEMPLATE_MODULE_OPTIONS)[number]['value'];

export function normalizeCampaignModuleForTemplates(module: string): SmsTemplateModuleType | null {
  const m = (module ?? '').trim().toLowerCase();
  if (m === 'teacher_attendance') {
    return 'attendance';
  }
  if (SMS_TEMPLATE_MODULE_OPTIONS.some(opt => opt.value === m)) {
    return m as SmsTemplateModuleType;
  }
  return null;
}

export function smsTemplateModuleLabel(moduleType: string | null | undefined): string {
  if (!moduleType) {
    return 'Not set';
  }
  return SMS_TEMPLATE_MODULE_OPTIONS.find(o => o.value === moduleType)?.label ?? moduleType;
}
