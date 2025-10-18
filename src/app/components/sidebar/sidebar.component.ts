import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PermissionService } from '../../core/services/permission.service';

interface MenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  permission?: string | string[]; // Required permission(s) to view this item
  permissionMode?: 'any' | 'all'; // How to check multiple permissions
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    SharedModule,
    RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isMobileOpen = false;
  @Input() isMobile = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();
  
  isCollapsed = false;
  
  // All menu items with their required permissions
  private allMenuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      permission: 'dashboard.view'
    },
    {
      name: 'Students',
      icon: 'school',
      permission: ['students.view', 'students.create'],
      permissionMode: 'any',
      children: [
        { 
          name: 'Student List', 
          icon: 'format_list_bulleted', 
          route: '/students',
          permission: 'students.view'
        },
        { 
          name: 'Add Student', 
          icon: 'person_add', 
          route: '/students/add',
          permission: 'students.create'
        }
      ]
    },
    {
      name: 'Teachers',
      icon: 'person',
      route: '/teachers',
      permission: 'teachers.view'
    },
    {
      name: 'Attendance',
      icon: 'check_circle',
      route: '/attendance',
      permission: ['attendance.view', 'attendance.mark'],
      permissionMode: 'any'
    },
    {
      name: 'Branches',
      icon: 'business',
      route: '/branches',
      permission: ['branches.view', 'branches.create'],
      permissionMode: 'any'
    },
    {
      name: 'Departments',
      icon: 'domain',
      route: '/departments',
      permission: 'departments.view'
    },
    {
      name: 'Subjects',
      icon: 'book',
      route: '/subjects',
      permission: 'subjects.view'
    },
    {
      name: 'Grades',
      icon: 'grade',
      route: '/grades',
      permission: 'grades.view'
    },
    {
      name: 'Sections',
      icon: 'class',
      route: '/sections',
      permission: 'sections.view'
    },
    {
      name: 'Groups',
      icon: 'group',
      route: '/groups',
      permission: 'groups.view'
    },
    {
      name: 'Accounts',
      icon: 'account_balance',
      route: '/accounts',
      permission: ['accounts.view', 'transactions.view'],
      permissionMode: 'any'
    },
    {
      name: 'Invoices',
      icon: 'description',
      route: '/invoices',
      permission: 'invoices.view'
    },
    {
      name: 'Fees',
      icon: 'payment',
      route: '/fees',
      permission: ['fees.view', 'fees.collect'],
      permissionMode: 'any'
    },
    {
      name: 'Holidays',
      icon: 'event',
      route: '/holidays',
      permission: 'holidays.view'
    }
  ];

  // Filtered menu items based on permissions
  menuItems: MenuItem[] = [];

  constructor(public permissionService: PermissionService) { }

  ngOnInit(): void {
    // Subscribe to permission changes to update menu dynamically
    this.permissionService.permissions$.subscribe(() => {
      this.filterMenuItems();
    });
    
    // Initial filter
    this.filterMenuItems();
    
    // Re-filter after a short delay to catch async permission loading
    setTimeout(() => {
      this.filterMenuItems();
    }, 500);
  }

  /**
   * Filter menu items based on user permissions
   */
  private filterMenuItems(): void {
    const currentPerms = this.permissionService.userPermissions();
    console.log('🔍 Filtering with permissions:', currentPerms.length, 'permissions loaded');
    
    this.menuItems = this.allMenuItems
      .filter(item => this.hasPermissionForItem(item))
      .map(item => {
        // Filter children if they exist
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter(child => 
            this.hasPermissionForItem(child)
          );
          
          // Only include parent if it has visible children or a route
          if (filteredChildren.length > 0 || item.route) {
            return {
              ...item,
              children: filteredChildren,
              expanded: false
            };
          }
          return null;
        }
        
        return { ...item, expanded: false };
      })
      .filter(item => item !== null) as MenuItem[];
  }

  /**
   * Check if user has permission to view menu item
   */
  private hasPermissionForItem(item: MenuItem): boolean {
    // If no permission specified, show by default
    if (!item.permission) {
      return true;
    }

    const permissions = Array.isArray(item.permission) 
      ? item.permission 
      : [item.permission];

    const mode = item.permissionMode || 'any';

    if (mode === 'all') {
      return this.permissionService.hasAllPermissions(permissions);
    } else {
      return this.permissionService.hasAnyPermission(permissions);
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  onMenuItemClick(): void {
    // Close sidebar on mobile when a menu item is clicked
    if (this.isMobile && this.isMobileOpen) {
      this.sidebarToggle.emit(true); // Emit true to collapse/close sidebar
    }
  }

  hasChildren(item: MenuItem): boolean {
    return !!(item.children && item.children.length > 0);
  }
}
