import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

interface MenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
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
  
  menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      name: 'Students',
      icon: 'groups',
      children: [
        { name: 'Student List', icon: 'format_list_bulleted', route: '/students' },
        { name: 'Student View', icon: 'visibility', route: '/students/view' },
        { name: 'Student Add', icon: 'person_add', route: '/students/add' },
        { name: 'Student Edit', icon: 'edit', route: '/students/edit' }
      ]
    },
    {
      name: 'Teachers',
      icon: 'person_pin',
      route: '/teachers'
    },
    {
      name: 'Departments',
      icon: 'business',
      route: '/departments'
    },
    {
      name: 'Subjects',
      icon: 'menu_book',
      route: '/subjects'
    },
    {
      name: 'Invoices',
      icon: 'receipt_long',
      route: '/invoices'
    },
    {
      name: 'Accounts',
      icon: 'account_balance',
      route: '/accounts'
    },
    {
      name: 'Holiday',
      icon: 'event',
      route: '/holidays'
    },
    {
      name: 'Fees',
      icon: 'payments',
      route: '/fees'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Set initial expanded state for all menu items
    this.menuItems.forEach(item => {
      item.expanded = false;
    });
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
