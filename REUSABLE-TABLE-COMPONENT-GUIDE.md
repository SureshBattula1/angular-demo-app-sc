# 📊 Reusable Data Table Component - Complete Guide

## 🎯 Overview

This guide explains how to use the **reusable data table component** with **advanced search sidebar** across all modules in your Angular application.

## 📁 Component Location

```
ui-app/src/app/shared/components/
├── data-table/
│   ├── data-table.component.ts
│   ├── data-table.component.html
│   ├── data-table.component.css
│   └── data-table.interface.ts
└── advanced-search-sidebar/
    ├── advanced-search-sidebar.component.ts
    ├── advanced-search-sidebar.component.html
    ├── advanced-search-sidebar.component.css
    └── search-field.interface.ts
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableConfig, TableColumn, TableAction } from '../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../shared/components/advanced-search-sidebar/search-field.interface';
```

### 2. Use in Template

```typescript
@Component({
  selector: 'app-your-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [data]="yourData"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Your Module List'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)"
      (exportClicked)="onExport($event)">
    </app-data-table>
  `
})
export class YourListComponent {
  // Your implementation here
}
```

## 📋 Configuration

### Table Configuration (TableConfig)

```typescript
tableConfig: TableConfig = {
  columns: [
    {
      key: 'id',              // Property key from data object
      header: 'ID',           // Display header text
      sortable: true,         // Enable sorting
      searchable: true,       // Enable search
      width: '100px',         // Column width
      align: 'left',          // Text alignment
      type: 'text',           // Cell type: text, number, date, badge, avatar
      cellClass: 'custom-class' // Optional CSS class
    }
  ],
  actions: [
    {
      icon: 'edit',
      label: 'Edit',
      color: 'primary',
      action: (row) => this.editItem(row),
      show: (row) => row.status !== 'archived' // Conditional visibility
    }
  ],
  selectable: true,         // Enable row selection
  pagination: true,         // Enable pagination (default: true)
  searchable: true,         // Enable basic search
  exportable: true,         // Enable export button
  responsive: true,         // Enable mobile card view
  pageSizeOptions: [5, 10, 25, 50],
  defaultPageSize: 10
};
```

### Advanced Search Configuration

```typescript
advancedSearchConfig: AdvancedSearchConfig = {
  title: 'Advanced Search',
  width: '450px',
  showReset: true,
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter name',
      icon: 'person',
      group: 'Basic Info'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      icon: 'flag',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      group: 'Status'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'daterange',
      group: 'Dates'
    }
  ]
};
```

## 🎨 Field Types

### Available Field Types for Advanced Search

1. **text** - Text input field
2. **number** - Number input field
3. **date** - Date picker
4. **daterange** - Date range picker
5. **select** - Dropdown select
6. **multiselect** - Multi-select dropdown
7. **autocomplete** - Autocomplete field
8. **radio** - Radio button group
9. **checkbox** - Checkbox group

### Example of Each Field Type

```typescript
fields: [
  // Text Input
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Enter name' },
  
  // Number Input
  { key: 'age', label: 'Age', type: 'number', placeholder: 'Enter age' },
  
  // Date Picker
  { key: 'birthdate', label: 'Birth Date', type: 'date' },
  
  // Select Dropdown
  {
    key: 'class',
    label: 'Class',
    type: 'select',
    options: [
      { value: '10', label: 'Class 10' },
      { value: '11', label: 'Class 11' }
    ]
  },
  
  // Multi-Select
  {
    key: 'subjects',
    label: 'Subjects',
    type: 'multiselect',
    options: [
      { value: 'math', label: 'Mathematics' },
      { value: 'science', label: 'Science' }
    ]
  },
  
  // Radio Buttons
  {
    key: 'gender',
    label: 'Gender',
    type: 'radio',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ]
  }
]
```

## 🔧 Component Inputs

| Input | Type | Description |
|-------|------|-------------|
| `data` | `any[]` | Array of data objects to display |
| `config` | `TableConfig` | Table configuration |
| `advancedSearchConfig` | `AdvancedSearchConfig` | Advanced search configuration (optional) |
| `title` | `string` | Table title |
| `loading` | `boolean` | Show loading spinner |

## 📤 Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `actionClicked` | `{action: string, row: any}` | Emitted when action button clicked |
| `rowClicked` | `any` | Emitted when row clicked |
| `selectionChanged` | `any[]` | Emitted when selection changes |
| `searchChanged` | `string` | Emitted when search query changes |
| `exportClicked` | `string` | Emitted when export button clicked |

## 📱 Responsive Features

### Desktop View
- Full table with all columns
- Sortable headers
- Horizontal scroll for many columns

### Tablet View
- Optimized spacing
- Mobile menu button appears
- Compact layout

### Mobile View (≤768px)
- Automatic switch to **card view**
- Touch-friendly buttons
- Full-width search
- Swipe-friendly table (if list view)

## 🎯 Complete Example: Teachers Module

```typescript
import { Component } from '@angular/core';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableConfig, TableAction } from '../../shared/components/data-table/data-table.interface';
import { AdvancedSearchConfig } from '../../shared/components/advanced-search-sidebar/search-field.interface';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [data]="teachers"
      [config]="tableConfig"
      [advancedSearchConfig]="advancedSearchConfig"
      [title]="'Teachers List'"
      [loading]="loading"
      (actionClicked)="onAction($event)"
      (rowClicked)="onRowClick($event)"
      (selectionChanged)="onSelectionChange($event)">
    </app-data-table>
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--spacing-lg);
    }
  `]
})
export class TeacherListComponent {
  loading = false;
  
  teachers = [
    {
      id: 'T001',
      name: 'John Smith',
      avatar: 'https://via.placeholder.com/40',
      subject: 'Mathematics',
      qualification: 'M.Sc',
      email: 'john@school.com',
      phone: '123-456-7890',
      experience: 10
    }
    // ... more teachers
  ];
  
  tableConfig: TableConfig = {
    columns: [
      { key: 'id', header: 'ID', sortable: true, width: '100px' },
      { key: 'avatar', header: 'Photo', type: 'avatar', width: '80px', align: 'center' },
      { key: 'name', header: 'Name', sortable: true, searchable: true },
      { key: 'subject', header: 'Subject', sortable: true },
      { key: 'qualification', header: 'Qualification', sortable: true },
      { key: 'email', header: 'Email', searchable: true },
      { key: 'phone', header: 'Phone', searchable: true },
      { key: 'experience', header: 'Experience (Years)', sortable: true, type: 'number' }
    ],
    actions: [
      {
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        action: (row) => this.editTeacher(row)
      },
      {
        icon: 'delete',
        label: 'Delete',
        color: 'warn',
        action: (row) => this.deleteTeacher(row)
      }
    ],
    selectable: true,
    pagination: true,
    searchable: true,
    exportable: true,
    responsive: true,
    defaultPageSize: 10
  };
  
  advancedSearchConfig: AdvancedSearchConfig = {
    title: 'Advanced Teacher Search',
    width: '450px',
    showReset: true,
    fields: [
      {
        key: 'name',
        label: 'Teacher Name',
        type: 'text',
        placeholder: 'Enter teacher name',
        icon: 'person',
        group: 'Basic Information'
      },
      {
        key: 'subject',
        label: 'Subject',
        type: 'select',
        icon: 'book',
        options: [
          { value: 'Mathematics', label: 'Mathematics' },
          { value: 'Science', label: 'Science' },
          { value: 'English', label: 'English' }
        ],
        group: 'Academic'
      },
      {
        key: 'qualification',
        label: 'Qualification',
        type: 'select',
        icon: 'school',
        options: [
          { value: 'B.Sc', label: 'B.Sc' },
          { value: 'M.Sc', label: 'M.Sc' },
          { value: 'PhD', label: 'PhD' }
        ],
        group: 'Academic'
      },
      {
        key: 'experience',
        label: 'Min Experience (Years)',
        type: 'number',
        placeholder: 'Enter minimum years',
        icon: 'work',
        group: 'Professional'
      }
    ]
  };
  
  onAction(event: { action: string, row: any }): void {
    console.log('Action:', event);
  }
  
  onRowClick(row: any): void {
    console.log('Row clicked:', row);
  }
  
  onSelectionChange(selected: any[]): void {
    console.log('Selected:', selected);
  }
  
  editTeacher(teacher: any): void {
    // Navigate to edit page
  }
  
  deleteTeacher(teacher: any): void {
    if (confirm(`Delete ${teacher.name}?`)) {
      this.teachers = this.teachers.filter(t => t.id !== teacher.id);
    }
  }
}
```

## 🎨 Customization

### Custom Cell Rendering

You can customize how cells are rendered:

```typescript
columns: [
  {
    key: 'status',
    header: 'Status',
    cellClass: (row) => {
      return row.status === 'active' ? 'status-active' : 'status-inactive';
    }
  }
]
```

### Conditional Actions

Show/hide actions based on row data:

```typescript
actions: [
  {
    icon: 'archive',
    label: 'Archive',
    action: (row) => this.archive(row),
    show: (row) => row.status !== 'archived' // Only show if not archived
  }
]
```

## 💡 Tips & Best Practices

1. **Group Related Fields**: Use the `group` property to organize search fields
2. **Use Icons**: Add `icon` property to make forms more intuitive
3. **Set Default Page Size**: Configure `defaultPageSize` based on your data density
4. **Enable Responsive**: Always set `responsive: true` for mobile support
5. **Use Searchable Columns**: Mark important columns as `searchable: true`
6. **Conditional Actions**: Use `show` property to control action visibility
7. **Export Functionality**: Implement `exportClicked` handler for data export

## 🔍 Search Features

### Basic Search
- Searches across all columns marked as `searchable: true`
- Real-time filtering as you type
- Case-insensitive search

### Advanced Search
- Right sidebar with grouped form fields
- Multiple field types (text, select, date, etc.)
- Conditional fields with `dependsOn`
- Save and load search criteria
- Reset functionality

## 📊 Features Summary

✅ **Sorting** - Click column headers to sort  
✅ **Pagination** - Customizable page sizes  
✅ **Selection** - Multi-row selection with checkboxes  
✅ **Search** - Basic and advanced search  
✅ **Export** - Export to CSV  
✅ **Actions** - Customizable row actions  
✅ **Responsive** - Auto card view on mobile  
✅ **Loading State** - Built-in spinner  
✅ **Custom Templates** - Support for custom cell rendering  

## 🚀 You're Ready!

This reusable table component can now be used in **ANY module** in your application. Just configure the columns and search fields, and you're good to go!

---

**Need Help?** Check the Student List component implementation as a reference example.

