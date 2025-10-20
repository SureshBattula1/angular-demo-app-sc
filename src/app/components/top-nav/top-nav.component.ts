import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent implements OnInit {
  @Output() mobileMenuToggle = new EventEmitter<void>();
  
  sidebarCollapsed = false;
  searchQuery = '';
  selectedLanguage = 'en';
  isMobile = false;
  
  languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleMobileMenu(): void {
    this.mobileMenuToggle.emit();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Emit event to parent component
    // This will be handled by the main layout component
  }

  onSearch(): void {
    // Implement search functionality
  }

  onLanguageChange(language: any): void {
    this.selectedLanguage = language.code;
  }

  openNotifications(): void {
  }

  openFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  onProfileMenuClick(action: string): void {
    // Implement profile menu actions
  }
}
