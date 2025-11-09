import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AccountService } from '../../services/account.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { AccountCategory } from '../../../../core/models/account.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-account-category-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './account-category-view.component.html',
  styleUrls: ['./account-category-view.component.scss']
})
export class AccountCategoryViewComponent implements OnInit {
  category?: AccountCategory;
  isLoading = true;
  categoryId!: number;

  // Permission checks
  hasEditPermission = false;
  hasDeletePermission = false;

  constructor(
    private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private permissionService: PermissionService,
    private snackBar: MatSnackBar
  ) {
    this.hasEditPermission = this.permissionService.hasPermission('accounts.edit');
    this.hasDeletePermission = this.permissionService.hasPermission('accounts.delete');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = +params['id'];
        this.loadCategory();
      }
    });
  }

  loadCategory(): void {
    this.isLoading = true;
    
    this.accountService.getCategory(this.categoryId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.category = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
        this.router.navigate(['/accounts/categories']);
      }
    });
  }

  onEdit(): void {
    if (!this.hasEditPermission) {
      this.errorHandler.showError('You do not have permission to edit categories');
      return;
    }
    this.router.navigate(['/accounts/categories', this.categoryId, 'edit']);
  }

  onDelete(): void {
    if (!this.hasDeletePermission) {
      this.errorHandler.showError('You do not have permission to delete categories');
      return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete "${this.category?.name}"?`);
    
    if (!confirmed) return;

    this.accountService.deleteCategory(this.categoryId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/accounts/categories']);
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }

  onToggleStatus(): void {
    if (!this.hasEditPermission) {
      this.errorHandler.showError('You do not have permission to edit categories');
      return;
    }

    this.accountService.toggleCategoryStatus(this.categoryId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Category status updated successfully', 'Close', { duration: 3000 });
          this.loadCategory();
        }
      },
      error: (error) => {
        this.errorHandler.handleError(error);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/accounts/categories']);
  }

  get transactionCount(): number {
    return this.category?.transactions?.length || 0;
  }

  get budgetCount(): number {
    return this.category?.budgets?.length || 0;
  }
}

