import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { LibraryService } from '../../services/library.service';
import { LibraryDashboardSummary, CirculationTrend } from '../../../../core/models/library.model';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';

@Component({
  selector: 'app-library-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './library-dashboard.component.html',
  styleUrls: ['./library-dashboard.component.scss']
})
export class LibraryDashboardComponent implements OnInit {
  loading = false;
  summary: LibraryDashboardSummary | null = null;
  trends: CirculationTrend[] = [];
  popularBooks: any[] = [];

  constructor(
    private libraryService: LibraryService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.libraryService.getDashboardSummary().subscribe({
      next: (res) => {
        this.summary = res.data || null;
      },
      error: (e) => this.errorHandler.showError(e)
    });

    this.libraryService.getCirculationTrends().subscribe({
      next: (res) => {
        this.trends = res.data || [];
      },
      error: (e) => this.errorHandler.showError(e)
    });

    this.libraryService.getPopularBooks().subscribe({
      next: (res) => {
        this.popularBooks = res.data || [];
        this.loading = false;
      },
      error: (e) => {
        this.errorHandler.showError(e);
        this.loading = false;
      }
    });
  }

  quickAction(route: string): void {
    this.router.navigate([`/library/${route}`]);
  }
}
