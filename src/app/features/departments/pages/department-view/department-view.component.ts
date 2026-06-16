import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { DepartmentService } from '../../services/department.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { Department } from '../../../../core/models/department.model';

@Component({
  selector: 'app-department-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './department-view.component.html',
  styleUrls: ['./department-view.component.scss']
})
export class DepartmentViewComponent implements OnInit {
  department?: Department;
  isLoading = true;
  departmentId!: string;

  // Permission checks
  hasEditPermission = false;
  hasDeletePermission = false;

  constructor(
    private departmentService: DepartmentService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private permissionService: PermissionService
  ) {
    this.hasEditPermission = this.permissionService.hasPermission('departments.edit');
    this.hasDeletePermission = this.permissionService.hasPermission('departments.delete');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.departmentId = params['id'];
        this.loadDepartment();
      }
    });
  }

  loadDepartment(): void {
    this.isLoading = true;
    
    this.departmentService.getDepartment(this.departmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.department = response.data;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorHandler.showError(error);
        this.isLoading = false;
        this.router.navigate(['/departments']);
      }
    });
  }

  onEdit(): void {
    if (!this.hasEditPermission) {
      this.errorHandler.showError('You do not have permission to edit departments');
      return;
    }
    this.router.navigate(['/departments/edit', this.departmentId]);
  }

  onDelete(): void {
    if (!this.hasDeletePermission) {
      this.errorHandler.showError('You do not have permission to delete departments');
      return;
    }
    
    if (confirm(`Are you sure you want to delete department "${this.department?.name}"?`)) {
      this.departmentService.deleteDepartment(this.departmentId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.errorHandler.showSuccess('Department deleted successfully');
            this.router.navigate(['/departments']);
          }
        },
        error: (error: any) => {
          this.errorHandler.showError(error);
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/departments']);
  }
}
