import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() hasPermission!: string | string[];
  @Input() hasPermissionMode: 'any' | 'all' = 'any';
  
  private destroy$ = new Subject<void>();
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    // Also subscribe to Observable for backward compatibility
    this.permissionService.permissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
    
    // Initial check
    this.updateView();
  }

  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermission(): boolean {
    if (!this.hasPermission) return true;

    const permissions = Array.isArray(this.hasPermission) 
      ? this.hasPermission 
      : [this.hasPermission];

    if (this.hasPermissionMode === 'all') {
      return this.permissionService.hasAllPermissions(permissions);
    } else {
      return this.permissionService.hasAnyPermission(permissions);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

