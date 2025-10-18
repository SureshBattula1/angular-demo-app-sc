import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../../shared/modules/material/material.module';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../../../core/models/role.model';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent implements OnInit {
  roles: Role[] = [];
  displayedColumns: string[] = ['id', 'name', 'description', 'permissions_count', 'actions'];
  isLoading = false;
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;

  constructor(
    private roleService: RoleService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService.getRoles({
      page: this.currentPage,
      per_page: this.pageSize
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data.data;
          this.totalRecords = response.data.total;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRoles();
  }

  viewRole(id: number): void {
    this.router.navigate(['/settings/roles/view', id]);
  }

  editRole(id: number): void {
    this.router.navigate(['/settings/roles/edit', id]);
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Role deleted successfully');
            this.loadRoles();
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error);
        }
      });
    }
  }

  createRole(): void {
    this.router.navigate(['/settings/roles/create']);
  }

  getPermissionsCount(role: Role): number {
    return role.permissions?.length || 0;
  }
}

