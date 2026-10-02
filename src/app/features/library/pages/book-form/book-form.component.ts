import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDatepicker } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

/** Show only the year in the Published Year picker's input. */
const YEAR_ONLY_FORMATS = {
  parse: { dateInput: { year: 'numeric' } },
  display: {
    dateInput: { year: 'numeric' },
    monthYearLabel: { year: 'numeric' },
    dateA11yLabel: { year: 'numeric' },
    monthYearA11yLabel: { year: 'numeric' },
  },
};
import { LibraryService } from '../../services/library.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { Book } from '../../../../core/models/book.model';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss'],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: YEAR_ONLY_FORMATS }]
})
export class BookFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;
  branches: Array<{ id: string | number; name: string }> = [];
  private bookId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private libraryService: LibraryService,
    private branchService: BranchService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      branch_id: [null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      author: ['', [Validators.required, Validators.maxLength(255)]],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      isbn: ['', Validators.maxLength(50)],
      language: ['English', [Validators.required, Validators.maxLength(50)]],
      publisher: [''],
      published_year: [null],
      published_year_date: [null], // bound to the year picker; synced to published_year
      edition: [''],
      pages: [null],
      total_copies: [1, [Validators.required, Validators.min(1)]],
      available_copies: [null],
      location: [''],
      description: [''],
      is_active: [true]
    });

    this.loadBranches();

    this.bookId = this.route.snapshot.paramMap.get('id');
    if (this.bookId) {
      this.isEdit = true;
      this.loadBook(this.bookId);
    }
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => { this.branches = (res.success && res.data) ? res.data.map(b => ({ id: b.id, name: b.name })) : []; },
      error: () => { this.branches = []; }
    });
  }

  private loadBook(id: string): void {
    this.loading = true;
    this.libraryService.getBook(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const b = res.data as Book;
          this.form.patchValue({
            branch_id: b.branch?.id ?? b.branch_id,
            title: b.title, author: b.author, category: b.category, isbn: b.isbn,
            language: b.language, publisher: b.publisher, published_year: b.published_year,
            published_year_date: b.published_year ? new Date(b.published_year, 0, 1) : null,
            edition: b.edition, pages: b.pages, total_copies: b.total_copies,
            available_copies: b.available_copies, location: b.location,
            description: b.description, is_active: b.is_active
          });
          // Branch can't change on edit (copies/issues are branch-bound).
          this.form.get('branch_id')?.disable();
        }
        this.loading = false;
      },
      error: (e) => { this.errorHandler.showError(e); this.loading = false; }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.form.getRawValue();
    delete payload.published_year_date; // UI-only control; API takes published_year (int)

    const done = (msg: string) => {
      this.saving = false;
      this.errorHandler.showSuccess(msg);
      this.router.navigate(['/library']);
    };
    const fail = (e: unknown) => { this.errorHandler.showError(e); this.saving = false; };

    if (this.isEdit && this.bookId) {
      // branch_id is disabled on edit; don't send it.
      delete payload.branch_id;
      this.libraryService.updateBook(this.bookId, payload).subscribe({
        next: (res) => res.success ? done('Book updated') : fail(res.message), error: fail
      });
    } else {
      this.libraryService.createBook(payload).subscribe({
        next: (res) => res.success ? done('Book created') : fail(res.message), error: fail
      });
    }
  }

  /** Year-only picker: capture the year and close before drilling into months/days. */
  onYearSelected(date: Date, picker: MatDatepicker<Date>): void {
    this.form.patchValue({
      published_year: date.getFullYear(),
      published_year_date: date
    });
    picker.close();
  }

  cancel(): void {
    this.router.navigate(['/library']);
  }
}
