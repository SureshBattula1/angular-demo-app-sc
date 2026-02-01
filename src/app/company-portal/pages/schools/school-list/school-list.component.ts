import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { CompanySchoolService } from '../../../services/school.service';
import { School } from '../../../../core/models/school.model';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.scss'
})
export class SchoolListComponent implements OnInit {
  schools = signal<School[]>([]);
  displayedColumns: string[] = ['name', 'code', 'status', 'branches', 'students', 'teachers', 'actions'];
  isLoading = signal<boolean>(false);
  searchTerm = '';
  statusFilter = '';
  
  // Pagination
  totalItems = 0;
  pageSize = 15;
  currentPage = 0;

  constructor(
    private schoolService: CompanySchoolService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(): void {
    this.isLoading.set(true);
    const params: any = {
      per_page: this.pageSize,
      page: this.currentPage + 1
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.schoolService.getSchools(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.schools.set(response.data);
          if (response.meta) {
            this.totalItems = response.meta.total || 0;
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadSchools();
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadSchools();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSchools();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'primary';
      case 'Inactive':
        return 'warn';
      case 'Suspended':
        return 'accent';
      case 'UnderConstruction':
        return '';
      default:
        return '';
    }
  }

  activateSchool(school: School): void {
    if (confirm(`Are you sure you want to activate ${school.name}?`)) {
      this.schoolService.activateSchool(school.id).subscribe({
        next: () => {
          this.loadSchools();
        }
      });
    }
  }

  deactivateSchool(school: School): void {
    if (confirm(`Are you sure you want to deactivate ${school.name}?`)) {
      this.schoolService.deactivateSchool(school.id).subscribe({
        next: () => {
          this.loadSchools();
        }
      });
    }
  }

  deleteSchool(school: School): void {
    if (confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
      this.schoolService.deleteSchool(school.id).subscribe({
        next: () => {
          this.loadSchools();
        }
      });
    }
  }

  viewSchool(id: number): void {
    this.router.navigate(['/company-portal/schools', id]);
  }

  editSchool(id: number): void {
    this.router.navigate(['/company-portal/schools', id, 'edit']);
  }
}
