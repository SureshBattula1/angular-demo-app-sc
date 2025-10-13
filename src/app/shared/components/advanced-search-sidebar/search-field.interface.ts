export type FieldType = 'text' | 'number' | 'date' | 'daterange' | 'select' | 'multiselect' | 'autocomplete' | 'checkbox' | 'radio';

export interface SearchFieldConfig {
  key: string;                          // Field key for filtering
  label: string;                        // Display label
  type: FieldType;                      // Input type
  placeholder?: string;                 // Placeholder text
  required?: boolean;                   // Required field
  options?: SearchOption[];             // For select/radio/checkbox
  multiple?: boolean;                   // For multi-select
  defaultValue?: any;                   // Default value
  validators?: any[];                   // Angular validators
  hint?: string;                        // Helper text
  icon?: string;                        // Material icon
  dependsOn?: string;                   // Conditional field (depends on another field)
  group?: string;                       // Group fields together
}

export interface SearchOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface AdvancedSearchConfig {
  title?: string;                       // Sidebar title
  fields: SearchFieldConfig[];          // Search fields
  showReset?: boolean;                  // Show reset button
  showSaveSearch?: boolean;             // Allow saving search criteria
  width?: string;                       // Sidebar width (default: 400px)
}

export interface SearchCriteria {
  [key: string]: any;                   // Dynamic search values
}

