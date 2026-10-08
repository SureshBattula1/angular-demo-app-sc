import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { LibraryService } from '../../../services/library.service';
import { LibraryBookCopy } from '../../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { Code128BarcodeComponent } from '../../../../../shared/components/code128-barcode/code128-barcode.component';

@Component({
  selector: 'app-barcode-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, Code128BarcodeComponent],
  templateUrl: './barcode-generator.component.html',
  styleUrls: ['./barcode-generator.component.scss']
})
export class BarcodeGeneratorComponent implements OnInit {
  loading = false;
  copies: LibraryBookCopy[] = [];
  selectedCopies: LibraryBookCopy[] = [];
  searchTerm = '';

  constructor(
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadCopies();
  }

  loadCopies(): void {
    this.loading = true;
    const params: Record<string, unknown> = { per_page: 50 };
    if (this.searchTerm.trim()) {
      params['search'] = this.searchTerm.trim();
    }

    this.libraryService.getCopies(params).subscribe({
      next: (res) => {
        this.copies = res.data || [];
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  toggleSelect(copy: LibraryBookCopy): void {
    const idx = this.selectedCopies.findIndex((c) => c.id === copy.id);
    if (idx > -1) {
      this.selectedCopies.splice(idx, 1);
    } else {
      this.selectedCopies.push(copy);
    }
  }

  isSelected(copy: LibraryBookCopy): boolean {
    return this.selectedCopies.some((c) => c.id === copy.id);
  }

  selectAll(): void {
    this.selectedCopies = [...this.copies];
  }

  clearSelection(): void {
    this.selectedCopies = [];
  }

  printLabels(): void {
    window.print();
  }
}
