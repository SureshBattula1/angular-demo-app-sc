import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LibraryService } from '../../services/library.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-library-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './library-reports.component.html',
  styleUrls: ['./library-reports.component.scss']
})
export class LibraryReportsComponent implements OnInit {
  activeReport: 'circulation' | 'inventory' | 'fines' = 'circulation';
  loading = false;
  reportData: any = null;

  startDate: string;
  endDate: string;

  constructor(
    private libraryService: LibraryService,
    private errorHandler: ErrorHandlerService
  ) {
    const now = new Date();
    this.endDate = now.toISOString().substring(0, 10);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.startDate = thirtyDaysAgo.toISOString().substring(0, 10);
  }

  ngOnInit(): void {
    this.loadCurrentReport();
  }

  selectReport(type: 'circulation' | 'inventory' | 'fines'): void {
    this.activeReport = type;
    this.loadCurrentReport();
  }

  loadCurrentReport(): void {
    this.loading = true;
    const params = { start_date: this.startDate, end_date: this.endDate };

    if (this.activeReport === 'circulation') {
      this.libraryService.getCirculationReport(params).subscribe({
        next: (res: any) => { this.reportData = res; this.loading = false; },
        error: (e: any) => { this.errorHandler.showError(e); this.loading = false; }
      });
    } else if (this.activeReport === 'inventory') {
      this.libraryService.getInventoryReport().subscribe({
        next: (res: any) => { this.reportData = res; this.loading = false; },
        error: (e: any) => { this.errorHandler.showError(e); this.loading = false; }
      });
    } else if (this.activeReport === 'fines') {
      this.libraryService.getFinesReport(params).subscribe({
        next: (res: any) => { this.reportData = res; this.loading = false; },
        error: (e: any) => { this.errorHandler.showError(e); this.loading = false; }
      });
    }
  }

  exportCSV(): void {
    if (!this.reportData?.data || this.reportData.data.length === 0) {
      alert('No data to export.');
      return;
    }

    const items = this.reportData.data;
    const keys = Object.keys(items[0]);
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...items.map((row: any) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_${this.activeReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
