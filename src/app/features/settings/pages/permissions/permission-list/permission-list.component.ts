import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { PermissionService } from '../../../services/permission.service';
import { Permission } from '../../../../../core/models/role.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MaterialModule, HasPermissionDirective],
  templateUrl: './permission-list.component.html',
  styleUrls: ['./permission-list.component.scss']
})
export class PermissionListComponent implements OnInit {
  permissions: Permission[] = [];
  filteredPermissions: Permission[] = [];
  displayedColumns: string[] = ['id', 'name', 'display_name', 'module', 'description', 'actions'];
  isLoading = false;
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  selectedModule = 'all';
  modules: string[] = [];

  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.isLoading = true;
    this.permissionService.getAllPermissions().subscribe({
      next: (response) => {
        if (response.success) {
          this.permissions = response.data;
          this.extractModules();
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  extractModules(): void {
    const moduleSet = new Set<string>();
    this.permissions.forEach(p => {
      if (p.module) {
        moduleSet.add(p.module);
      }
    });
    this.modules = Array.from(moduleSet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.permissions];

    // Filter by module
    if (this.selectedModule !== 'all') {
      filtered = filtered.filter(p => p.module === this.selectedModule);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.display_name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    this.filteredPermissions = filtered;
    this.totalRecords = filtered.length;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onModuleChange(): void {
    this.applyFilters();
  }

  viewPermission(id: number): void {
    this.router.navigate(['/settings/permissions/view', id]);
  }

  editPermission(id: number): void {
    this.router.navigate(['/settings/permissions/edit', id]);
  }

  deletePermission(permission: Permission): void {
    if (confirm(`Are you sure you want to delete the permission "${permission.name}"?`)) {
      this.permissionService.deletePermission(permission.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Permission deleted successfully');
            this.loadPermissions();
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
        }
      });
    }
  }

  createPermission(): void {
    this.router.navigate(['/settings/permissions/create']);
  }
}

