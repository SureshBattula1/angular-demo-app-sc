import {
  AdvancedSearchConfig,
  SearchFieldConfig,
  SearchOption
} from '../../../shared/components/advanced-search-sidebar/search-field.interface';

/** Matches `notification_campaign_recipients.section` for branch team rows (grade = Staff). */
export const BRANCH_TEAM_ROLE_OPTIONS: SearchOption[] = [
  { value: 'teachers', label: 'Teachers' },
  { value: 'staff', label: 'Staff' },
  { value: 'accounts', label: 'Accountant' },
  { value: 'admins', label: 'Admins' }
];

export const BRANCH_TEAM_SECTION_LABELS: Record<string, string> = {
  teachers: 'Teachers',
  staff: 'Staff',
  accounts: 'Accountant',
  admins: 'Admins'
};

export function branchTeamSearchFields(forRecipients: boolean): SearchFieldConfig[] {
  const group = 'Branch team';
  if (forRecipients) {
    return [
      {
        key: 'audience',
        label: 'Recipient type',
        type: 'select',
        group,
        placeholder: 'Students and team',
        icon: 'groups',
        options: [
          { value: 'student', label: 'Students only' },
          { value: 'team', label: 'Branch team only' }
        ]
      },
      {
        key: 'team_role',
        label: 'Team role',
        type: 'select',
        group,
        placeholder: 'Any role',
        icon: 'badge',
        options: [...BRANCH_TEAM_ROLE_OPTIONS]
      }
    ];
  }

  return [
    {
      key: 'includes_team',
      label: 'Branch team included',
      type: 'select',
      group,
      placeholder: 'Any',
      icon: 'groups',
      options: [
        { value: '1', label: 'Includes team recipients' },
        { value: '0', label: 'Students only (no team)' }
      ]
    },
    {
      key: 'team_role',
      label: 'Team role notified',
      type: 'select',
      group,
      placeholder: 'Any role',
      icon: 'badge',
      options: [...BRANCH_TEAM_ROLE_OPTIONS]
    }
  ];
}

export function createCampaignRecipientAdvancedSearchConfig(
  partial?: Partial<AdvancedSearchConfig>
): AdvancedSearchConfig {
  return {
    title: 'Filter recipients',
    width: '400px',
    showReset: true,
    showSaveSearch: false,
    fields: [
      {
        key: 'delivery_status',
        label: 'Delivery',
        type: 'select',
        group: 'Delivery & engagement',
        placeholder: 'Any delivery status',
        icon: 'send',
        options: [
          { value: 'sent', label: 'Sent' },
          { value: 'failed', label: 'Failed' },
          { value: 'processing', label: 'Processing' },
          { value: 'queued', label: 'Queued' }
        ]
      },
      {
        key: 'grade',
        label: 'Class',
        type: 'select',
        group: 'Students',
        placeholder: 'Any class',
        icon: 'school',
        options: []
      },
      {
        key: 'section',
        label: 'Section',
        type: 'select',
        group: 'Students',
        placeholder: 'Any section',
        icon: 'class',
        options: [],
        dependsOn: 'grade'
      },
      {
        key: 'status_key',
        label: 'Status tag',
        type: 'text',
        group: 'Students',
        placeholder: 'e.g. present, absent',
        icon: 'label'
      },
      ...branchTeamSearchFields(true),
      {
        key: 'viewed',
        label: 'Viewed',
        type: 'select',
        group: 'Delivery & engagement',
        placeholder: 'Any',
        icon: 'visibility',
        options: [
          { value: '1', label: 'Viewed' },
          { value: '0', label: 'Not viewed' }
        ]
      },
      {
        key: 'liked',
        label: 'Liked',
        type: 'select',
        group: 'Delivery & engagement',
        placeholder: 'Any',
        icon: 'thumb_up',
        options: [
          { value: '1', label: 'Liked' },
          { value: '0', label: 'Not liked' }
        ]
      }
    ],
    ...partial
  };
}

export function appendHubTeamFields(fields: SearchFieldConfig[]): SearchFieldConfig[] {
  return [...fields, ...branchTeamSearchFields(false)];
}
