import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImportService } from '../../services/import.service';
import { ImportModule } from '../../../../core/models/import.model';

@Component({
  selector: 'app-import-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './import-dashboard.component.html',
  styleUrls: ['./import-dashboard.component.scss']
})
export class ImportDashboardComponent implements OnInit {
  importModules: ImportModule[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private importService: ImportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.loading = true;
    this.error = null;

    this.importService.getModules().subscribe({
      next: (modules) => {
        this.importModules = modules;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load import modules';
        this.loading = false;
      }
    });
  }

  selectModule(module: ImportModule): void {
    const moduleName = module.name.toLowerCase();
    this.router.navigate(['/imports', moduleName]);
  }

  viewHistory(): void {
    this.router.navigate(['/imports/history']);
  }

  formatDate(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

