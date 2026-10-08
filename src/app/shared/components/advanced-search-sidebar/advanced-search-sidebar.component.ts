import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { AdvancedSearchConfig, SearchFieldConfig, SearchCriteria } from './search-field.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-advanced-search-sidebar',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './advanced-search-sidebar.component.html',
  styleUrls: ['./advanced-search-sidebar.component.css']
})
export class AdvancedSearchSidebarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() config!: AdvancedSearchConfig;
  @Input() savedSearches: any[] = [];

  @Output() searchApplied = new EventEmitter<SearchCriteria>();
  @Output() searchReset = new EventEmitter<void>();
  @Output() searchSaved = new EventEmitter<{ name: string; criteria: SearchCriteria }>();
  @Output() closed = new EventEmitter<void>();
  @Output() fieldValueChanged = new EventEmitter<{ field: string; value: unknown }>();

  searchForm!: FormGroup;
  groupedFields: Record<string, SearchFieldConfig[]> = {};
  groupKeys: string[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly formReset$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    if (this.config) {
      this.initializeForm();
      this.groupFields();
    }
  }

  ngOnDestroy(): void {
    this.formReset$.next();
    this.formReset$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      const previousConfig = changes['config'].previousValue as AdvancedSearchConfig | undefined;
      const structureChanged =
        !previousConfig || this.configStructureKey(previousConfig) !== this.configStructureKey(this.config);

      if (!this.searchForm || structureChanged) {
        this.initializeForm();
      }
      this.groupFields();
    }
  }

  /** Field keys/types/dependencies — ignore option list changes to avoid form flicker. */
  private configStructureKey(config: AdvancedSearchConfig): string {
    return config.fields
      .map(field => `${field.key}|${field.type}|${field.dependsOn ?? ''}|${field.group ?? ''}`)
      .join(';');
  }

  initializeForm(): void {
    this.formReset$.next();
    const formControls: Record<string, unknown> = {};
    const previousValues = this.searchForm?.getRawValue() ?? {};

    this.config.fields.forEach(field => {
      const validators = field.required ? [Validators.required, ...(field.validators || [])] : field.validators || [];
      const preserved = previousValues[field.key];
      const initial =
        preserved !== undefined && preserved !== null && preserved !== ''
          ? preserved
          : (field.defaultValue ?? null);
      formControls[field.key] = [initial, validators];
    });

    this.searchForm = this.fb.group(formControls);
    this.setupDependencies();
  }

  setupDependencies(): void {
    this.config.fields.forEach(field => {
      const control = this.searchForm.get(field.key);
      if (control) {
        control.valueChanges
          .pipe(takeUntil(this.formReset$), takeUntil(this.destroy$))
          .subscribe(value => {
            this.fieldValueChanged.emit({ field: field.key, value });
          });
      }

      if (field.dependsOn) {
        const dependentControl = this.searchForm.get(field.dependsOn);
        const currentControl = this.searchForm.get(field.key);

        if (dependentControl && currentControl) {
          dependentControl.valueChanges
            .pipe(takeUntil(this.formReset$), takeUntil(this.destroy$))
            .subscribe(value => {
              if (value) {
                currentControl.enable({ emitEvent: false });
              } else {
                currentControl.disable({ emitEvent: false });
                currentControl.setValue(null, { emitEvent: false });
              }
            });

          if (!dependentControl.value) {
            currentControl.disable({ emitEvent: false });
          }
        }
      }
    });
  }

  groupFields(): void {
    const grouped: Record<string, SearchFieldConfig[]> = {};

    this.config.fields.forEach(field => {
      const group = field.group || 'General';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(field);
    });

    this.groupedFields = grouped;
    this.groupKeys = Object.keys(grouped);
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const criteria: SearchCriteria = {};

      Object.keys(this.searchForm.value).forEach(key => {
        let value = this.searchForm.value[key];

        const field = this.config.fields.find(f => f.key === key);
        if (field && field.type === 'date' && value instanceof Date) {
          value = this.formatDate(value);
        }

        if (value !== null && value !== undefined && value !== '') {
          criteria[key] = value;
        }
      });

      this.searchApplied.emit(criteria);
      this.close();
    } else {
      Object.keys(this.searchForm.controls).forEach(key => {
        this.searchForm.controls[key].markAsTouched();
      });
    }
  }

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

  resetForm(): void {
    if (!this.searchForm) {
      return;
    }
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

  loadSavedSearch(savedSearch: { criteria: SearchCriteria }): void {
    this.searchForm.patchValue(savedSearch.criteria);
  }

  close(): void {
    this.closed.emit();
  }

  getFieldOptions(field: SearchFieldConfig): { value: unknown; label: string; disabled?: boolean }[] {
    return (field.options || []) as { value: unknown; label: string; disabled?: boolean }[];
  }

  isFieldVisible(field: SearchFieldConfig): boolean {
    if (!field.dependsOn) {
      return true;
    }

    const dependentControl = this.searchForm.get(field.dependsOn);
    return !!dependentControl?.value;
  }

  getFormControl(key: string) {
    return this.searchForm.get(key);
  }

  getGroupKeys(): string[] {
    return this.groupKeys.length ? this.groupKeys : Object.keys(this.groupedFields);
  }
}
