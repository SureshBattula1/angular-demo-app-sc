# Filter Count Badge Feature

## Overview
The Advanced Search icon now displays a notification badge showing the count of active filters applied to the data table. This provides users with a clear visual indicator of how many filters are currently active.

## Implementation Details

### Components Modified

#### 1. Data Table Component (TypeScript)
**File**: `src/app/shared/components/data-table/data-table.component.ts`

**New Method**: `getActiveFilterCount()`
```typescript
/**
 * Get the count of active advanced search filters
 * Excludes empty values and pagination/sorting parameters
 */
getActiveFilterCount(): number {
  if (!this.currentFilters) {
    return 0;
  }
  
  // List of keys to exclude from filter count (pagination, sorting, etc.)
  const excludeKeys = ['page', 'per_page', 'sort_by', 'sort_direction', 'search'];
  
  // Count non-empty filter values
  let count = 0;
  for (const key in this.currentFilters) {
    if (this.currentFilters.hasOwnProperty(key) && !excludeKeys.includes(key)) {
      const value = this.currentFilters[key];
      
      // Only count non-empty, non-null values
      if (value !== null && value !== undefined && value !== '') {
        // For arrays, only count if not empty
        if (Array.isArray(value)) {
          if (value.length > 0) {
            count++;
          }
        } else {
          count++;
        }
      }
    }
  }
  
  return count;
}
```

#### 2. Data Table Component (HTML)
**File**: `src/app/shared/components/data-table/data-table.component.html`

**Modified**: Advanced Search Button
```html
<!-- Advanced Search Button -->
<button mat-icon-button 
  *ngIf="advancedSearchConfig"
  class="advanced-search-btn"
  matTooltip="Advanced Search"
  [matBadge]="getActiveFilterCount()"
  [matBadgeHidden]="getActiveFilterCount() === 0"
  matBadgeColor="primary"
  matBadgeSize="small"
  (click)="openAdvancedSearch()">
  <mat-icon>tune</mat-icon>
</button>
```

**Key Features**:
- `[matBadge]="getActiveFilterCount()"` - Displays the count
- `[matBadgeHidden]="getActiveFilterCount() === 0"` - Hides badge when no filters
- `matBadgeColor="primary"` - Uses primary theme color
- `matBadgeSize="small"` - Uses small badge size

#### 3. Data Table Component (CSS)
**File**: `src/app/shared/components/data-table/data-table.component.css`

**Added Styles**:
```css
/* Filter Count Badge Styling */
::ng-deep .advanced-search-btn .mat-badge-content {
  background-color: #ff5722;
  color: white;
  font-weight: 600;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  border-radius: 9px;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

::ng-deep .advanced-search-btn .mat-badge-small .mat-badge-content {
  font-size: 9px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  border-radius: 8px;
  padding: 0 3px;
}
```

## How It Works

1. **Filter Application**: When users apply advanced search filters, they are stored in the `currentFilters` object
2. **Count Calculation**: The `getActiveFilterCount()` method:
   - Iterates through `currentFilters`
   - Excludes pagination/sorting parameters (`page`, `per_page`, `sort_by`, `sort_direction`, `search`)
   - Counts only non-empty, non-null values
   - Handles arrays by checking if they have elements
3. **Badge Display**: Material's `matBadge` directive:
   - Shows the count on the advanced search icon
   - Automatically hides when count is 0
   - Uses a prominent red color (#ff5722) to catch attention
   - Includes a subtle shadow for depth

## User Experience Benefits

✅ **Clear Visual Feedback**: Users can see at a glance how many filters are active
✅ **Better UX**: No need to open the advanced search panel to check active filters
✅ **Intuitive**: Works like notification badges in familiar apps
✅ **Responsive**: Badge automatically updates when filters are added/removed

## Modules Using This Feature

### Student Module
**Component**: `student-list.component.ts`
- Automatically displays filter count for student searches
- Works with all student filter fields:
  - Branch
  - Admission Number
  - Roll Number
  - Grade
  - Section
  - Student Status
  - Gender

## Future Enhancements

This feature can be easily extended to other modules:
- Teachers
- Grades
- Sections
- Branches
- Subjects
- Attendance
- Fees

**No additional code required** - the feature is built into the `data-table` component and works automatically for any component that uses it with `advancedSearchConfig`.

## Testing

To test the feature:

1. Navigate to Students List
2. Click on the Advanced Search icon (tune icon)
3. Apply some filters (e.g., select a Branch, Gender, etc.)
4. Click "Apply"
5. Observe the badge showing the count of active filters on the tune icon
6. Click "Reset" in the advanced search panel
7. Observe the badge disappearing when all filters are cleared

## Technical Notes

- The badge uses Material Design's `MatBadgeModule`
- The color scheme uses a high-contrast red (#ff5722) for visibility
- The implementation is performant as it only counts on render
- The feature is completely backward compatible - components without advanced search are unaffected

