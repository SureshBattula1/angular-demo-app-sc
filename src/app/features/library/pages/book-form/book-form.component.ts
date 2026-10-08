import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDatepicker } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { Subscription, forkJoin } from 'rxjs';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LibraryService } from '../../services/library.service';
import { BranchService } from '../../../branches/services/branch.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import {
  Book,
  LibraryCategory,
  LibraryAuthor,
  LibraryPublisher,
  LibraryShelf,
  LibrarySubject
} from '../../../../core/models/library.model';

import { Code128BarcodeComponent } from '../../../../shared/components/code128-barcode/code128-barcode.component';

export interface CopyEntry {
  copy_number: number;
  barcode: string;
  accession_number: string;
  shelf_id: string | number | null;
  condition: string;
  purchase_price: number | null;
}

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

export type QuickAddType = 'category' | 'author' | 'publisher' | 'shelf' | 'subject';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule, Code128BarcodeComponent],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss'],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: YEAR_ONLY_FORMATS }]
})
export class BookFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  quickAddForm!: FormGroup;

  isEdit = false;
  loading = false;
  saving = false;
  loadingMasters = false;
  savingQuickAdd = false;

  branches: { id: string | number; name: string }[] = [];
  categories: LibraryCategory[] = [];
  authors: LibraryAuthor[] = [];
  publishers: LibraryPublisher[] = [];
  shelves: LibraryShelf[] = [];
  subjects: LibrarySubject[] = [];

  readonly languages: string[] = [
    'English',
    'Hindi',
    'Bengali',
    'Telugu',
    'Marathi',
    'Tamil',
    'Urdu',
    'Gujarati',
    'Kannada',
    'Malayalam',
    'Odia',
    'Punjabi',
    'Sanskrit',
    'Arabic',
    'French',
    'German',
    'Spanish',
    'Russian',
    'Chinese',
    'Japanese',
    'Other'
  ];

  quickAddType: QuickAddType | null = null;
  private bookId: string | null = null;
  private pendingBook: Book | null = null;
  private sub = new Subscription();

  // Copy & Barcode Management State
  copiesMode: 'auto' | 'custom' = 'auto';
  barcodePrefix = 'BC';
  accessionPrefix = 'ACC-';
  customCopies: CopyEntry[] = [
    {
      copy_number: 1,
      barcode: '',
      accession_number: '',
      shelf_id: null,
      condition: 'Good',
      purchase_price: null
    }
  ];

  constructor(
    private fb: FormBuilder,
    private libraryService: LibraryService,
    private branchService: BranchService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadBranches();

    this.bookId = this.route.snapshot.paramMap.get('id');
    if (this.bookId) {
      this.isEdit = true;
      this.loadBook(this.bookId);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private initForms(): void {
    this.form = this.fb.group({
      branch_id: [null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      author: ['', Validators.maxLength(255)],
      author_id: [null],
      category: ['', Validators.maxLength(100)],
      category_id: [null],
      publisher: [''],
      publisher_id: [null],
      shelf_id: [null],
      subject_ids: [[]],
      isbn: ['', Validators.maxLength(50)],
      language: ['English', [Validators.required, Validators.maxLength(50)]],
      published_year: [null],
      published_year_date: [null], // bound to year picker
      edition: [''],
      ddc_code: [''],
      call_number: [''],
      pages: [null],
      total_copies: [1, [Validators.required, Validators.min(1)]],
      available_copies: [null],
      location: [''],
      description: [''],
      is_active: [true]
    });

    this.quickAddForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      code: [''],
      description: [''],
      nationality: [''],
      born_year: [null],
      contact_person: [''],
      email: [''],
      phone: [''],
      rack_number: [''],
      shelf_number: [''],
      floor: [''],
      room: [''],
      capacity: [50]
    });

    // When branch changes, reload masters
    this.sub.add(
      this.form.get('branch_id')?.valueChanges.subscribe((branchId) => {
        if (branchId) {
          this.loadMasters(branchId);
        }
      })
    );

    // Keep custom copies in sync when total_copies changes
    this.sub.add(
      this.form.get('total_copies')?.valueChanges.subscribe((count) => {
        if (this.copiesMode === 'custom' && count && Number(count) > 0) {
          this.syncCustomCopiesCount(Number(count));
        }
      })
    );
  }

  private loadBranches(): void {
    this.branchService.getBranches({ is_active: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branches = res.data.map(b => ({ id: b.id, name: b.name }));
          // If creating new book and branch is not set, select first branch by default
          if (!this.isEdit && this.branches.length > 0 && !this.form.get('branch_id')?.value) {
            this.form.patchValue({ branch_id: this.branches[0].id });
          }
        } else {
          this.branches = [];
        }
      },
      error: () => {
        this.branches = [];
      }
    });
  }

  public loadMasters(branchId: string | number): void {
    this.loadingMasters = true;
    forkJoin({
      categories: this.libraryService.getCategories({ branch_id: branchId, per_page: 250 }),
      authors: this.libraryService.getAuthors({ branch_id: branchId, per_page: 250 }),
      publishers: this.libraryService.getPublishers({ branch_id: branchId, per_page: 250 }),
      shelves: this.libraryService.getShelves({ branch_id: branchId, per_page: 250 }),
      subjects: this.libraryService.getSubjects({ branch_id: branchId, per_page: 250 })
    }).subscribe({
      next: (res) => {
        this.categories = (res.categories.success && res.categories.data) ? res.categories.data : [];
        this.authors = (res.authors.success && res.authors.data) ? res.authors.data : [];
        this.publishers = (res.publishers.success && res.publishers.data) ? res.publishers.data : [];
        this.shelves = (res.shelves.success && res.shelves.data) ? res.shelves.data : [];
        this.subjects = (res.subjects.success && res.subjects.data) ? res.subjects.data : [];
        this.loadingMasters = false;

        if (this.pendingBook) {
          this.bindBookToMasters(this.pendingBook);
        }
      },
      error: () => {
        this.loadingMasters = false;
      }
    });
  }

  private loadBook(id: string): void {
    this.loading = true;
    this.libraryService.getBook(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const b = res.data as Book;
          this.pendingBook = b;
          const branchId = b.branch?.id ?? b.branch_id;

          this.form.patchValue({
            branch_id: branchId,
            title: b.title,
            author: b.author,
            author_id: b.author_id ?? null,
            category: b.category,
            category_id: b.category_id ?? null,
            publisher: b.publisher,
            publisher_id: b.publisher_id ?? null,
            shelf_id: b.shelf_id ?? null,
            subject_ids: b.subjects ? b.subjects.map(s => s.id) : (b.subject_ids ?? []),
            isbn: b.isbn,
            language: b.language || 'English',
            published_year: b.published_year,
            published_year_date: b.published_year ? new Date(b.published_year, 0, 1) : null,
            edition: b.edition,
            ddc_code: b.ddc_code,
            call_number: b.call_number,
            pages: b.pages,
            total_copies: b.total_copies,
            available_copies: b.available_copies,
            location: b.location,
            description: b.description,
            is_active: b.is_active ?? true
          });

          // Branch can't change on edit
          this.form.get('branch_id')?.disable();

          if (b.copies && b.copies.length > 0) {
            this.customCopies = b.copies.map((c) => ({
              copy_number: c.copy_number,
              barcode: c.barcode || '',
              accession_number: c.accession_number || '',
              shelf_id: c.shelf_id ?? null,
              condition: c.condition || 'Good',
              purchase_price: c.purchase_price != null ? Number(c.purchase_price) : null
            }));
          }

          if (branchId) {
            this.loadMasters(branchId);
          }
        }
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  private bindBookToMasters(b: Book): void {
    // 1. Category sync
    let catId = b.category_id ?? null;
    if (!catId && b.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === b.category?.toLowerCase());
      if (match) {
        catId = match.id;
      }
    }
    if (catId) {
      const hasOption = this.categories.some(c => String(c.id) === String(catId));
      if (!hasOption && b.category_master) {
        this.categories = [...this.categories, b.category_master as LibraryCategory];
      }
      this.form.patchValue({ category_id: catId });
    }

    // 2. Author sync
    let authorId = b.author_id ?? null;
    if (!authorId && b.author) {
      const match = this.authors.find(a => a.name.toLowerCase() === b.author?.toLowerCase());
      if (match) {
        authorId = match.id;
      }
    }
    if (authorId) {
      const hasOption = this.authors.some(a => String(a.id) === String(authorId));
      if (!hasOption && b.author_master) {
        this.authors = [...this.authors, b.author_master as LibraryAuthor];
      }
      this.form.patchValue({ author_id: authorId });
    }

    // 3. Publisher sync
    let pubId = b.publisher_id ?? null;
    if (!pubId && b.publisher) {
      const match = this.publishers.find(p => p.name.toLowerCase() === b.publisher?.toLowerCase());
      if (match) {
        pubId = match.id;
      }
    }
    if (pubId) {
      const hasOption = this.publishers.some(p => String(p.id) === String(pubId));
      if (!hasOption && b.publisher_master) {
        this.publishers = [...this.publishers, b.publisher_master as LibraryPublisher];
      }
      this.form.patchValue({ publisher_id: pubId });
    }

    // 4. Shelf sync
    if (b.shelf_id) {
      this.form.patchValue({ shelf_id: b.shelf_id });
    } else if (b.location) {
      const match = this.shelves.find(s => {
        const fullCode = s.code || `${s.rack_number}${s.shelf_number ? '-' + s.shelf_number : ''}`;
        return fullCode.toLowerCase() === b.location?.toLowerCase() || s.rack_number.toLowerCase() === b.location?.toLowerCase();
      });
      if (match) {
        this.form.patchValue({ shelf_id: match.id });
      }
    }

    // 5. Subjects sync
    if (b.subjects && b.subjects.length > 0) {
      const subIds = b.subjects.map(s => s.id);
      // Ensure missing subjects in list are added
      b.subjects.forEach(s => {
        if (!this.subjects.some(existing => String(existing.id) === String(s.id))) {
          this.subjects = [...this.subjects, s as LibrarySubject];
        }
      });
      this.form.patchValue({ subject_ids: subIds });
    }
  }

  // ================= SELECTION HANDLERS =================
  onCategorySelect(value: unknown): void {
    if (value === '__NEW__') {
      const prev = this.form.get('category_id')?.value;
      if (prev === '__NEW__') this.form.patchValue({ category_id: null });
      this.openQuickAdd('category');
      return;
    }
    const catId = value as string | number | null;
    const match = this.categories.find(c => String(c.id) === String(catId));
    this.form.patchValue({
      category_id: catId,
      category: match ? match.name : ''
    });
  }

  onAuthorSelect(value: unknown): void {
    if (value === '__NEW__') {
      const prev = this.form.get('author_id')?.value;
      if (prev === '__NEW__') this.form.patchValue({ author_id: null });
      this.openQuickAdd('author');
      return;
    }
    const authorId = value as string | number | null;
    const match = this.authors.find(a => String(a.id) === String(authorId));
    this.form.patchValue({
      author_id: authorId,
      author: match ? match.name : ''
    });
  }

  onPublisherSelect(value: unknown): void {
    if (value === '__NEW__') {
      const prev = this.form.get('publisher_id')?.value;
      if (prev === '__NEW__') this.form.patchValue({ publisher_id: null });
      this.openQuickAdd('publisher');
      return;
    }
    const pubId = value as string | number | null;
    const match = this.publishers.find(p => String(p.id) === String(pubId));
    this.form.patchValue({
      publisher_id: pubId,
      publisher: match ? match.name : ''
    });
  }

  onShelfSelect(value: unknown): void {
    if (value === '__NEW__') {
      const prev = this.form.get('shelf_id')?.value;
      if (prev === '__NEW__') this.form.patchValue({ shelf_id: null });
      this.openQuickAdd('shelf');
      return;
    }
    const shelfId = value as string | number | null;
    const match = this.shelves.find(s => String(s.id) === String(shelfId));
    if (match) {
      const loc = match.code || `${match.rack_number}${match.shelf_number ? '-' + match.shelf_number : ''}`;
      this.form.patchValue({
        shelf_id: shelfId,
        location: loc
      });
    } else {
      this.form.patchValue({ shelf_id: null });
    }
  }

  onSubjectSelect(values: (string | number)[]): void {
    if (values && values.includes('__NEW__')) {
      const filtered = values.filter(v => v !== '__NEW__');
      this.form.patchValue({ subject_ids: filtered });
      this.openQuickAdd('subject');
    }
  }

  // ================= INLINE QUICK-ADD =================
  openQuickAdd(type: QuickAddType): void {
    const branchId = this.form.get('branch_id')?.value;
    if (!branchId) {
      this.errorHandler.showError('Please select a branch first before creating catalog masters.');
      return;
    }
    this.quickAddType = type;
    this.quickAddForm.reset({
      capacity: 50
    });
  }

  closeQuickAdd(): void {
    this.quickAddType = null;
    this.quickAddForm.reset();
  }

  get quickAddTitle(): string {
    switch (this.quickAddType) {
      case 'category': return 'Category';
      case 'author': return 'Author';
      case 'publisher': return 'Publisher';
      case 'shelf': return 'Shelf / Rack';
      case 'subject': return 'Subject';
      default: return '';
    }
  }

  saveQuickAdd(): void {
    const branchId = this.form.get('branch_id')?.value;
    if (!branchId) {
      this.errorHandler.showError('Please select a branch first.');
      return;
    }
    if (!this.quickAddType) return;

    const raw = this.quickAddForm.getRawValue();
    this.savingQuickAdd = true;

    if (this.quickAddType === 'category') {
      if (!raw.name?.trim()) {
        this.errorHandler.showError('Category name is required.');
        this.savingQuickAdd = false;
        return;
      }
      this.libraryService.createCategory({
        branch_id: branchId,
        name: raw.name.trim(),
        code: raw.code?.trim() || null,
        description: raw.description?.trim() || null
      }).subscribe({
        next: (res) => {
          this.savingQuickAdd = false;
          if (res.success && res.data) {
            const newCat = res.data;
            this.categories = [...this.categories, newCat];
            this.form.patchValue({
              category_id: newCat.id,
              category: newCat.name
            });
            this.errorHandler.showSuccess(`Category "${newCat.name}" created and selected!`);
            this.closeQuickAdd();
          } else {
            this.errorHandler.showError(res.message || 'Failed to create category');
          }
        },
        error: (e) => {
          this.savingQuickAdd = false;
          this.errorHandler.showError(e);
        }
      });
    } else if (this.quickAddType === 'author') {
      if (!raw.name?.trim()) {
        this.errorHandler.showError('Author name is required.');
        this.savingQuickAdd = false;
        return;
      }
      this.libraryService.createAuthor({
        branch_id: branchId,
        name: raw.name.trim(),
        nationality: raw.nationality?.trim() || null,
        born_year: raw.born_year || null
      }).subscribe({
        next: (res) => {
          this.savingQuickAdd = false;
          if (res.success && res.data) {
            const newAuthor = res.data;
            this.authors = [...this.authors, newAuthor];
            this.form.patchValue({
              author_id: newAuthor.id,
              author: newAuthor.name
            });
            this.errorHandler.showSuccess(`Author "${newAuthor.name}" created and selected!`);
            this.closeQuickAdd();
          } else {
            this.errorHandler.showError(res.message || 'Failed to create author');
          }
        },
        error: (e) => {
          this.savingQuickAdd = false;
          this.errorHandler.showError(e);
        }
      });
    } else if (this.quickAddType === 'publisher') {
      if (!raw.name?.trim()) {
        this.errorHandler.showError('Publisher name is required.');
        this.savingQuickAdd = false;
        return;
      }
      this.libraryService.createPublisher({
        branch_id: branchId,
        name: raw.name.trim(),
        contact_person: raw.contact_person?.trim() || null,
        phone: raw.phone?.trim() || null,
        email: raw.email?.trim() || null
      }).subscribe({
        next: (res) => {
          this.savingQuickAdd = false;
          if (res.success && res.data) {
            const newPub = res.data;
            this.publishers = [...this.publishers, newPub];
            this.form.patchValue({
              publisher_id: newPub.id,
              publisher: newPub.name
            });
            this.errorHandler.showSuccess(`Publisher "${newPub.name}" created and selected!`);
            this.closeQuickAdd();
          } else {
            this.errorHandler.showError(res.message || 'Failed to create publisher');
          }
        },
        error: (e) => {
          this.savingQuickAdd = false;
          this.errorHandler.showError(e);
        }
      });
    } else if (this.quickAddType === 'shelf') {
      if (!raw.rack_number?.trim()) {
        this.errorHandler.showError('Rack number is required.');
        this.savingQuickAdd = false;
        return;
      }
      this.libraryService.createShelf({
        branch_id: branchId,
        rack_number: raw.rack_number.trim(),
        shelf_number: raw.shelf_number?.trim() || null,
        floor: raw.floor?.trim() || null,
        room: raw.room?.trim() || null,
        capacity: raw.capacity || 50
      }).subscribe({
        next: (res) => {
          this.savingQuickAdd = false;
          if (res.success && res.data) {
            const newShelf = res.data;
            this.shelves = [...this.shelves, newShelf];
            const loc = newShelf.code || `${newShelf.rack_number}${newShelf.shelf_number ? '-' + newShelf.shelf_number : ''}`;
            this.form.patchValue({
              shelf_id: newShelf.id,
              location: loc
            });
            this.errorHandler.showSuccess(`Shelf "${loc}" created and selected!`);
            this.closeQuickAdd();
          } else {
            this.errorHandler.showError(res.message || 'Failed to create shelf');
          }
        },
        error: (e) => {
          this.savingQuickAdd = false;
          this.errorHandler.showError(e);
        }
      });
    } else if (this.quickAddType === 'subject') {
      if (!raw.name?.trim()) {
        this.errorHandler.showError('Subject name is required.');
        this.savingQuickAdd = false;
        return;
      }
      this.libraryService.createSubject({
        branch_id: branchId,
        name: raw.name.trim(),
        code: raw.code?.trim() || null
      }).subscribe({
        next: (res) => {
          this.savingQuickAdd = false;
          if (res.success && res.data) {
            const newSub = res.data;
            this.subjects = [...this.subjects, newSub];
            const currentSubIds = (this.form.get('subject_ids')?.value || []) as (string | number)[];
            this.form.patchValue({
              subject_ids: [...currentSubIds, newSub.id]
            });
            this.errorHandler.showSuccess(`Subject "${newSub.name}" created and added!`);
            this.closeQuickAdd();
          } else {
            this.errorHandler.showError(res.message || 'Failed to create subject');
          }
        },
        error: (e) => {
          this.savingQuickAdd = false;
          this.errorHandler.showError(e);
        }
      });
    }
  }

  // ================= FORM SUBMISSION =================
  submit(): void {
    const authorVal = this.form.get('author')?.value;
    const authorIdVal = this.form.get('author_id')?.value;
    if (!authorVal && !authorIdVal) {
      this.form.get('author_id')?.setErrors({ required: true });
    } else {
      this.form.get('author_id')?.setErrors(null);
    }

    const catVal = this.form.get('category')?.value;
    const catIdVal = this.form.get('category_id')?.value;
    if (!catVal && !catIdVal) {
      this.form.get('category_id')?.setErrors({ required: true });
    } else {
      this.form.get('category_id')?.setErrors(null);
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorHandler.showError('Please check required fields in the form.');
      return;
    }

    this.saving = true;
    const payload = this.form.getRawValue();
    delete payload.published_year_date; // UI-only helper control

    payload.copies_mode = this.copiesMode;
    payload.barcode_prefix = (this.barcodePrefix || 'BC').trim();
    payload.accession_prefix = (this.accessionPrefix || 'ACC-').trim();

    if (this.copiesMode === 'custom') {
      payload.copies = this.customCopies;
      payload.total_copies = this.customCopies.length;
      if (!payload.available_copies) {
        payload.available_copies = this.customCopies.length;
      }
    }

    const done = (msg: string) => {
      this.saving = false;
      this.errorHandler.showSuccess(msg);
      this.router.navigate(['/library/catalog/books']);
    };
    const fail = (e: unknown) => {
      this.errorHandler.showError(e);
      this.saving = false;
    };

    if (this.isEdit && this.bookId) {
      delete payload.branch_id;
      this.libraryService.updateBook(this.bookId, payload).subscribe({
        next: (res) => res.success ? done('Book updated successfully') : fail(res.message),
        error: fail
      });
    } else {
      this.libraryService.createBook(payload).subscribe({
        next: (res) => res.success ? done('Book created successfully') : fail(res.message),
        error: fail
      });
    }
  }

  // ================= COPIES & BARCODES HELPERS =================
  get autoCopiesPreview(): { copyNum: number; accession: string; barcode: string }[] {
    const total = Math.max(1, Math.min(20, Number(this.form.get('total_copies')?.value) || 1));
    const branchId = this.form.get('branch_id')?.value || 1;
    const items = [];
    const bcPrefix = (this.barcodePrefix || 'BC').trim();
    const accPrefix = (this.accessionPrefix || 'ACC-').trim();
    for (let i = 1; i <= total; i++) {
      items.push({
        copyNum: i,
        accession: `${accPrefix}${branchId}-NEW-${String(i).padStart(3, '0')}`,
        barcode: `${bcPrefix}${branchId}NEW${String(i).padStart(3, '0')}`
      });
    }
    return items;
  }

  onCopiesModeChange(mode: 'auto' | 'custom'): void {
    this.copiesMode = mode;
    if (mode === 'custom') {
      const currentCount = Number(this.form.get('total_copies')?.value) || 1;
      this.syncCustomCopiesCount(currentCount);
    } else {
      this.form.patchValue({ total_copies: this.customCopies.length });
    }
  }

  syncCustomCopiesCount(targetCount: number): void {
    const count = Math.max(1, Math.min(100, targetCount));
    const branchId = this.form.get('branch_id')?.value || 1;
    const defaultShelf = this.form.get('shelf_id')?.value || null;
    const accPrefix = (this.accessionPrefix || 'ACC-').trim();
    const bcPrefix = (this.barcodePrefix || 'BC').trim();

    while (this.customCopies.length < count) {
      const num = this.customCopies.length + 1;
      this.customCopies.push({
        copy_number: num,
        barcode: `${bcPrefix}${branchId}NEW${String(num).padStart(3, '0')}`,
        accession_number: `${accPrefix}${branchId}-NEW-${String(num).padStart(3, '0')}`,
        shelf_id: defaultShelf,
        condition: 'Good',
        purchase_price: null
      });
    }

    if (this.customCopies.length > count) {
      this.customCopies = this.customCopies.slice(0, count);
    }
    this.form.patchValue({ total_copies: this.customCopies.length }, { emitEvent: false });
  }

  addCustomCopy(): void {
    const branchId = this.form.get('branch_id')?.value || 1;
    const defaultShelf = this.form.get('shelf_id')?.value || null;
    const accPrefix = (this.accessionPrefix || 'ACC-').trim();
    const bcPrefix = (this.barcodePrefix || 'BC').trim();
    const num = this.customCopies.length + 1;

    this.customCopies.push({
      copy_number: num,
      barcode: `${bcPrefix}${branchId}NEW${String(num).padStart(3, '0')}`,
      accession_number: `${accPrefix}${branchId}-NEW-${String(num).padStart(3, '0')}`,
      shelf_id: defaultShelf,
      condition: 'Good',
      purchase_price: null
    });
    this.form.patchValue({ total_copies: this.customCopies.length });
  }

  removeCustomCopy(index: number): void {
    if (this.customCopies.length <= 1) return;
    this.customCopies.splice(index, 1);
    this.customCopies.forEach((c, idx) => {
      c.copy_number = idx + 1;
    });
    this.form.patchValue({ total_copies: this.customCopies.length });
  }

  autofillEmptyBarcodes(): void {
    const branchId = this.form.get('branch_id')?.value || 1;
    const accPrefix = (this.accessionPrefix || 'ACC-').trim();
    const bcPrefix = (this.barcodePrefix || 'BC').trim();

    this.customCopies.forEach((c, idx) => {
      if (!c.barcode.trim()) {
        c.barcode = `${bcPrefix}${branchId}NEW${String(idx + 1).padStart(3, '0')}`;
      }
      if (!c.accession_number.trim()) {
        c.accession_number = `${accPrefix}${branchId}-NEW-${String(idx + 1).padStart(3, '0')}`;
      }
    });
  }

  onBarcodeFieldEnter(nextIndex: number): void {
    const el = document.getElementById('copy-barcode-' + nextIndex);
    if (el) {
      el.focus();
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
    this.router.navigate(['/library/catalog/books']);
  }
}
