import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { AdvancedSearchConfig, SearchFieldConfig, SearchCriteria } from './search-field.interface';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-advanced-search-sidebar',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './advanced-search-sidebar.component.html',
  styleUrls: ['./advanced-search-sidebar.component.css'],
  animations: [
    trigger('slideIn', [
      state('closed', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('open', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('closed => open', animate('300ms ease-out')),
      transition('open => closed', animate('300ms ease-in'))
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AdvancedSearchSidebarComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() config!: AdvancedSearchConfig;
  @Input() savedSearches: any[] = [];
  
  @Output() searchApplied = new EventEmitter<SearchCriteria>();
  @Output() searchReset = new EventEmitter<void>();
  @Output() searchSaved = new EventEmitter<{ name: string, criteria: SearchCriteria }>();
  @Output() closed = new EventEmitter<void>();
  @Output() fieldValueChanged = new EventEmitter<{ field: string, value: any }>();
  
  searchForm!: FormGroup;
  groupedFields: { [key: string]: SearchFieldConfig[] } = {};
  private previousConfig?: AdvancedSearchConfig;
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    if (this.config) {
      this.initializeForm();
      this.groupFields();
      this.previousConfig = this.config;
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Only reinitialize if the config has actually changed, not when isOpen changes
    if (changes['config'] && !changes['config'].firstChange) {
      const currentConfig = changes['config'].currentValue;
      const previousConfig = changes['config'].previousValue;
      
      // Check if the config has actually changed (not just reference)
      if (JSON.stringify(currentConfig) !== JSON.stringify(previousConfig)) {
        if (this.searchForm && this.config) {
          this.initializeForm();
          this.groupFields();
          this.previousConfig = this.config;
        }
      }
    }
    // Initialize form if it doesn't exist yet and we have config
    else if (!this.searchForm && this.config) {
      this.initializeForm();
      this.groupFields();
      this.previousConfig = this.config;
    }
  }
  
  initializeForm(): void {
    const formControls: any = {};
    
    this.config.fields.forEach(field => {
      const validators = field.required ? [Validators.required, ...(field.validators || [])] : field.validators || [];
      formControls[field.key] = [field.defaultValue || null, validators];
    });
    
    this.searchForm = this.fb.group(formControls);
    
    // Setup field dependencies
    this.setupDependencies();
  }
  
  setupDependencies(): void {
    this.config.fields.forEach(field => {
      // Emit value changes for all fields
      const control = this.searchForm.get(field.key);
      if (control) {
        control.valueChanges.subscribe(value => {
          this.fieldValueChanged.emit({ field: field.key, value });
        });
      }
      
      // Handle field dependencies
      if (field.dependsOn) {
        const dependentControl = this.searchForm.get(field.dependsOn);
        const currentControl = this.searchForm.get(field.key);
        
        if (dependentControl && currentControl) {
          dependentControl.valueChanges.subscribe(value => {
            if (value) {
              currentControl.enable();
            } else {
              currentControl.disable();
              currentControl.setValue(null);
            }
          });
          
          // Initial state
          if (!dependentControl.value) {
            currentControl.disable();
          }
        }
      }
    });
  }
  
  groupFields(): void {
    this.groupedFields = {};
    
    this.config.fields.forEach(field => {
      const group = field.group || 'General';
      if (!this.groupedFields[group]) {
        this.groupedFields[group] = [];
      }
      this.groupedFields[group].push(field);
    });
  }
  
  onSearch(): void {
    if (this.searchForm.valid) {
      const criteria: SearchCriteria = {};
      
      // Only include fields with values
      Object.keys(this.searchForm.value).forEach(key => {
        let value = this.searchForm.value[key];
        
        // Check if this is a date field
        const field = this.config.fields.find(f => f.key === key);
        if (field && field.type === 'date' && value instanceof Date) {
          // Format date as YYYY-MM-DD
          value = this.formatDate(value);
        }
        
        if (value !== null && value !== undefined && value !== '') {
          criteria[key] = value;
        }
      });
      
      this.searchApplied.emit(criteria);
      this.close();
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.searchForm.controls).forEach(key => {
        this.searchForm.controls[key].markAsTouched();
      });
    }
  }
  
  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  onReset(): void {
    this.resetForm();
    this.searchReset.emit();
  }

  /** Reset form to defaults (for external use, e.g. Clear All Filters button). Does not emit. */
  resetForm(): void {
    if (!this.searchForm) return;
    this.searchForm.reset();
    this.config?.fields?.forEach(field => {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        this.searchForm.get(field.key)?.setValue(field.defaultValue);
      }
    });
  }
  
  onSaveSearch(): void {
    const searchName = prompt('Enter a name for this search:');
    if (searchName) {
      const criteria = this.searchForm.value;
      this.searchSaved.emit({ name: searchName, criteria });
    }
  }
  
  loadSavedSearch(savedSearch: any): void {
    this.searchForm.patchValue(savedSearch.criteria);
  }
  
  close(): void {
    this.closed.emit();
  }
  
  getFieldOptions(field: SearchFieldConfig): any[] {
    return field.options || [];
  }
  
  isFieldVisible(field: SearchFieldConfig): boolean {
    if (!field.dependsOn) return true;
    
    const dependentControl = this.searchForm.get(field.dependsOn);
    return !!(dependentControl?.value);
  }
  
  getFormControl(key: string) {
    return this.searchForm.get(key);
  }
  
  getGroupKeys(): string[] {
    return Object.keys(this.groupedFields);
  }
}

