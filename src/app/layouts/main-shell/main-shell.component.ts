import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../../shared/modules/material/material.module';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { PermissionService } from '../../core/services/permission.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, HasPermissionDirective],
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss']
})
export class MainShellComponent implements OnInit {
  isHandset$: Observable<boolean>;
  isSidebarCollapsed = true; // Start collapsed by default (icons only on desktop, hidden on mobile/tablet)
  selectedTheme = 'ocean-blue';
  isTablet = false;
  isMobile = false;
  
  // Theme definitions
  // themes = {
  //   'teal-green': {
  //     primary: '#00897b',
  //     primaryLight: '#4db6ac',
  //     primaryDark: '#00695c',
  //     accent: '#4caf50',
  //     accentLight: '#81c784',
  //     accentDark: '#388e3c'
  //   },
  //   'indigo-pink': {
  //     primary: '#3f51b5',
  //     primaryLight: '#7986cb',
  //     primaryDark: '#303f9f',
  //     accent: '#ff4081',
  //     accentLight: '#ff79b0',
  //     accentDark: '#c60055'
  //   },
  //   'blue-orange': {
  //     primary: '#1976d2',
  //     primaryLight: '#42a5f5',
  //     primaryDark: '#1565c0',
  //     accent: '#ff9800',
  //     accentLight: '#ffb74d',
  //     accentDark: '#f57c00'
  //   },
  //   'purple-pink': {
  //     primary: '#9c27b0',
  //     primaryLight: '#ba68c8',
  //     primaryDark: '#7b1fa2',
  //     accent: '#e91e63',
  //     accentLight: '#f06292',
  //     accentDark: '#c2185b'
  //   },
  //   'red-gray': {
  //     primary: '#d32f2f',
  //     primaryLight: '#ef5350',
  //     primaryDark: '#c62828',
  //     accent: '#616161',
  //     accentLight: '#9e9e9e',
  //     accentDark: '#424242'
  //   }
  // };
   // themes.ts
 themes = {
  "ocean-blue": {
    primary:"#1E88E5", primaryLight:"#90CAF9", primaryDark:"#1565C0",
    accent:"#00B8D9",  accentLight:"#80E1EF",  accentDark:"#008DA7",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7F8",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
  },
  "corporate-blue-gray": {
    primary:"#2B6CB0", primaryLight:"#A0C4FF", primaryDark:"#1E4E8C",
    accent:"#38B2AC",  accentLight:"#B2F5EA",  accentDark:"#2C7A7B",
    neutral:"#5E6775", surface:"#FFFFFF", softSurface:"#F5F7FA",
    success:"#10B981", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
  },
  "sunset-orange": {
    primary:"#F97316", primaryLight:"#FDBA74", primaryDark:"#EA580C",
    accent:"#FF6B6B",  accentLight:"#FFB3B3",  accentDark:"#E04646",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF7F3",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
  },
  "forest-green": {
    primary:"#2E7D32", primaryLight:"#81C784", primaryDark:"#1B5E20",
    accent:"#23C55E",  accentLight:"#86EFAC",  accentDark:"#16A34A",
    neutral:"#64748B", surface:"#FFFFFF", softSurface:"#F6FBF7",
    success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
  },
  "royal-purple": {
    primary:"#7C3AED", primaryLight:"#C4B5FD", primaryDark:"#5B21B6",
    accent:"#A78BFA",  accentLight:"#DDD6FE",  accentDark:"#8B5CF6",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F8F6FF",
    success:"#22C55E", warning:"#EAB308", danger:"#DC2626", info:"#4F46E5"
  },
  "ruby-red": {
    primary:"#E11D48", primaryLight:"#FDA4AF", primaryDark:"#9F1239",
    accent:"#F43F5E",  accentLight:"#FECDD3",  accentDark:"#BE123C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F7",
    success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
  },
  "teal-mint": {
    primary:"#0D9488", primaryLight:"#99F6E4", primaryDark:"#0F766E",
    accent:"#14B8A6",  accentLight:"#5EEAD4",  accentDark:"#0B9F8F",
    neutral:"#607D8B", surface:"#FFFFFF", softSurface:"#F4FFFD",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#0891B2"
  },
  "amber-gold": {
    primary:"#D97706", primaryLight:"#FDE68A", primaryDark:"#B45309",
    accent:"#F59E0B",  accentLight:"#FCD34D",  accentDark:"#C2410C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF9EB",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "slate-gray": {
    primary:"#475569", primaryLight:"#94A3B8", primaryDark:"#334155",
    accent:"#0EA5E9",  accentLight:"#BAE6FD",  accentDark:"#0369A1",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F8FA",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "midnight-blue": {
    primary:"#0F172A", primaryLight:"#334155", primaryDark:"#0B1220",
    accent:"#14B8A6",  accentLight:"#5EEAD4",  accentDark:"#0D9488",
    neutral:"#94A3B8", surface:"#0B0F14", softSurface:"#111827",
    success:"#22C55E", warning:"#EAB308", danger:"#F87171", info:"#60A5FA"
  },
  "lavender-dream": {
    primary:"#8B5CF6", primaryLight:"#DDD6FE", primaryDark:"#6D28D9",
    accent:"#EC4899",  accentLight:"#FBCFE8",  accentDark:"#BE185D",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FBF7FF",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#6366F1"
  },
  "coral-reef": {
    primary:"#FB7185", primaryLight:"#FECDD3", primaryDark:"#E11D48",
    accent:"#F59E0B",  accentLight:"#FED7AA",  accentDark:"#C2410C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF6F7",
    success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
  },
  "emerald-city": {
    primary:"#059669", primaryLight:"#6EE7B7", primaryDark:"#047857",
    accent:"#34D399",  accentLight:"#A7F3D0",  accentDark:"#10B981",
    neutral:"#64748B", surface:"#FFFFFF", softSurface:"#F3FFF9",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#0EA5E9"
  },
  "graphite": {
    primary:"#374151", primaryLight:"#9CA3AF", primaryDark:"#1F2937",
    accent:"#60A5FA",  accentLight:"#BFDBFE",  accentDark:"#1D4ED8",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7F8",
    success:"#10B981", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
  },
  "cobalt-sky": {
    primary:"#2563EB", primaryLight:"#93C5FD", primaryDark:"#1D4ED8",
    accent:"#22D3EE",  accentLight:"#A5F3FC",  accentDark:"#0891B2",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F5F9FF",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
  },
  "flamingo": {
    primary:"#F43F5E", primaryLight:"#FECDD3", primaryDark:"#BE123C",
    accent:"#FB7185",  accentLight:"#FFD1DC",  accentDark:"#E11D48",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F7",
    success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#3B82F6"
  },
  "coffee-cream": {
    primary:"#8B5E34", primaryLight:"#D6BFA5", primaryDark:"#5E3D22",
    accent:"#D97706",  accentLight:"#FCD34D",  accentDark:"#B45309",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FAF7F3",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#2563EB"
  },
  "moss": {
    primary:"#3F6212", primaryLight:"#A3E635", primaryDark:"#365314",
    accent:"#65A30D",  accentLight:"#D9F99D",  accentDark:"#4D7C0F",
    neutral:"#64748B", surface:"#FFFFFF", softSurface:"#F7FBF3",
    success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
  },
  "indigo-night": {
    primary:"#4338CA", primaryLight:"#C7D2FE", primaryDark:"#3730A3",
    accent:"#06B6D4",  accentLight:"#A5F3FC",  accentDark:"#0E7490",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F6F7FF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#3B82F6"
  },
  "arctic-ice": {
    primary:"#38BDF8", primaryLight:"#BAE6FD", primaryDark:"#0284C7",
    accent:"#22D3EE",  accentLight:"#CFFAFE",  accentDark:"#0891B2",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F5FBFF",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "desert-sand": {
    primary:"#D4A373", primaryLight:"#F1DEC9", primaryDark:"#A36C3D",
    accent:"#EAB308",  accentLight:"#FDE68A",  accentDark:"#B45309",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF9F2",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "wine-berry": {
    primary:"#7F1D1D", primaryLight:"#FCA5A5", primaryDark:"#581313",
    accent:"#DB2777",  accentLight:"#FBCFE8",  accentDark:"#9D174D",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF6F6",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
  },
  "aqua-splash": {
    primary:"#06B6D4", primaryLight:"#A5F3FC", primaryDark:"#0E7490",
    accent:"#10B981",  accentLight:"#A7F3D0",  accentDark:"#059669",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F2FEFF",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "lime-zest": {
    primary:"#65A30D", primaryLight:"#D9F99D", primaryDark:"#4D7C0F",
    accent:"#22C55E",  accentLight:"#86EFAC",  accentDark:"#16A34A",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7FFF2",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
  },
  "plum": {
    primary:"#6D28D9", primaryLight:"#DDD6FE", primaryDark:"#5B21B6",
    accent:"#F472B6",  accentLight:"#FBCFE8",  accentDark:"#DB2777",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FBF7FF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#6366F1"
  },
  "steel": {
    primary:"#607D8B", primaryLight:"#B0BEC5", primaryDark:"#546E7A",
    accent:"#29B6F6",  accentLight:"#81D4FA",  accentDark:"#0288D1",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F6F8FA",
    success:"#10B981", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
  },
  "peach-blush": {
    primary:"#FB923C", primaryLight:"#FED7AA", primaryDark:"#C2410C",
    accent:"#F472B6",  accentLight:"#FBCFE8",  accentDark:"#BE185D",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF7F2",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "navy-copper": {
    primary:"#1E3A8A", primaryLight:"#93C5FD", primaryDark:"#172554",
    accent:"#B45309",  accentLight:"#FCD34D",  accentDark:"#7C2D12",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F6F8FF",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
  },
  "orchid": {
    primary:"#C026D3", primaryLight:"#F5D0FE", primaryDark:"#86198F",
    accent:"#06B6D4",  accentLight:"#BAE6FD",  accentDark:"#0E7490",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF6FF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#3B82F6"
  },
  "sky-mist": {
    primary:"#60A5FA", primaryLight:"#BFDBFE", primaryDark:"#2563EB",
    accent:"#34D399",  accentLight:"#A7F3D0",  accentDark:"#059669",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7FBFF",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "bronze": {
    primary:"#B45309", primaryLight:"#F59E0B", primaryDark:"#7C2D12",
    accent:"#D97706",  accentLight:"#FCD34D",  accentDark:"#92400E",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF8F2",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "pine": {
    primary:"#14532D", primaryLight:"#86EFAC", primaryDark:"#0B3A1F",
    accent:"#22C55E",  accentLight:"#A7F3D0",  accentDark:"#16A34A",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F3FFF7",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
  },
  "cherry": {
    primary:"#B91C1C", primaryLight:"#FCA5A5", primaryDark:"#7F1D1D",
    accent:"#F43F5E",  accentLight:"#FECDD3",  accentDark:"#BE123C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F5",
    success:"#16A34A", warning:"#F59E0B", danger:"#B91C1C", info:"#2563EB"
  },
  "ocean-deep": {
    primary:"#0E7490", primaryLight:"#67E8F9", primaryDark:"#155E75",
    accent:"#38BDF8",  accentLight:"#BAE6FD",  accentDark:"#0284C7",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F3FBFF",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "sunflower": {
    primary:"#EAB308", primaryLight:"#FDE68A", primaryDark:"#A16207",
    accent:"#F59E0B",  accentLight:"#FED7AA",  accentDark:"#C2410C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFFCEE",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "charcoal": {
    primary:"#111827", primaryLight:"#374151", primaryDark:"#0B1220",
    accent:"#22D3EE",  accentLight:"#A5F3FC",  accentDark:"#0891B2",
    neutral:"#9CA3AF", surface:"#0B0F14", softSurface:"#111827",
    success:"#22C55E", warning:"#EAB308", danger:"#F87171", info:"#60A5FA"
  },
  "turquoise": {
    primary:"#14B8A6", primaryLight:"#99F6E4", primaryDark:"#0D9488",
    accent:"#06B6D4",  accentLight:"#BAE6FD",  accentDark:"#0E7490",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F2FFFB",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "maroon": {
    primary:"#7F1D1D", primaryLight:"#FCA5A5", primaryDark:"#450A0A",
    accent:"#DB2777",  accentLight:"#FBCFE8",  accentDark:"#9D174D",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F5",
    success:"#22C55E", warning:"#EAB308", danger:"#DC2626", info:"#3B82F6"
  },
  "glacier": {
    primary:"#93C5FD", primaryLight:"#DBEAFE", primaryDark:"#2563EB",
    accent:"#67E8F9",  accentLight:"#CFFAFE",  accentDark:"#0891B2",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F6FAFF",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "saffron": {
    primary:"#F59E0B", primaryLight:"#FCD34D", primaryDark:"#C2410C",
    accent:"#F97316",  accentLight:"#FDBA74",  accentDark:"#EA580C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF7EC",
    success:"#16A34A", warning:"#D97706", danger:"#B91C1C", info:"#2563EB"
  },
  "cyan": {
    primary:"#06B6D4", primaryLight:"#A5F3FC", primaryDark:"#0E7490",
    accent:"#3B82F6",  accentLight:"#93C5FD",  accentDark:"#1D4ED8",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F4FCFF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#2563EB"
  },
  "olive": {
    primary:"#4D7C0F", primaryLight:"#A3E635", primaryDark:"#3F6212",
    accent:"#84CC16",  accentLight:"#D9F99D",  accentDark:"#65A30D",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7FFF2",
    success:"#22C55E", warning:"#EAB308", danger:"#DC2626", info:"#3B82F6"
  },
  "periwinkle": {
    primary:"#6366F1", primaryLight:"#C7D2FE", primaryDark:"#4F46E5",
    accent:"#22D3EE",  accentLight:"#BAE6FD",  accentDark:"#0891B2",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F6F8FF",
    success:"#10B981", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
  },
  "graphite-blue": {
    primary:"#334155", primaryLight:"#94A3B8", primaryDark:"#1F2937",
    accent:"#2563EB",  accentLight:"#93C5FD",  accentDark:"#1D4ED8",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F8FA",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "rose": {
    primary:"#E11D48", primaryLight:"#FDA4AF", primaryDark:"#9F1239",
    accent:"#F472B6",  accentLight:"#FBCFE8",  accentDark:"#BE185D",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF5F7",
    success:"#16A34A", warning:"#F59E0B", danger:"#DC2626", info:"#3B82F6"
  },
  "mint-cream": {
    primary:"#10B981", primaryLight:"#A7F3D0", primaryDark:"#059669",
    accent:"#22D3EE",  accentLight:"#BAE6FD",  accentDark:"#0E7490",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F3FFFA",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "onyx": {
    primary:"#0B1220", primaryLight:"#1F2937", primaryDark:"#000A12",
    accent:"#60A5FA",  accentLight:"#BFDBFE",  accentDark:"#1D4ED8",
    neutral:"#9CA3AF", surface:"#0B0F14", softSurface:"#111827",
    success:"#22C55E", warning:"#EAB308", danger:"#F87171", info:"#60A5FA"
  },
  "aurora": {
    primary:"#22D3EE", primaryLight:"#A5F3FC", primaryDark:"#0891B2",
    accent:"#A78BFA",  accentLight:"#DDD6FE",  accentDark:"#8B5CF6",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F4FBFF",
    success:"#10B981", warning:"#F59E0B", danger:"#EF4444", info:"#3B82F6"
  },
  "denim": {
    primary:"#1D4ED8", primaryLight:"#93C5FD", primaryDark:"#1E40AF",
    accent:"#0EA5E9",  accentLight:"#BAE6FD",  accentDark:"#0369A1",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F5F8FF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#2563EB"
  },
  "blush": {
    primary:"#F472B6", primaryLight:"#FBCFE8", primaryDark:"#DB2777",
    accent:"#FB7185",  accentLight:"#FECDD3",  accentDark:"#E11D48",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF6FA",
    success:"#22C55E", warning:"#EAB308", danger:"#DC2626", info:"#3B82F6"
  },
  "citrus": {
    primary:"#84CC16", primaryLight:"#D9F99D", primaryDark:"#65A30D",
    accent:"#F59E0B",  accentLight:"#FCD34D",  accentDark:"#B45309",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7FFF2",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "clay": {
    primary:"#9A3412", primaryLight:"#FDBA74", primaryDark:"#7C2D12",
    accent:"#D97706",  accentLight:"#FCD34D",  accentDark:"#B45309",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF7F2",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "mulberry": {
    primary:"#8E44AD", primaryLight:"#D7BDE2", primaryDark:"#6C3483",
    accent:"#3498DB",  accentLight:"#AED6F1",  accentDark:"#2E86C1",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FBF7FF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#3B82F6"
  },
  "seaweed": {
    primary:"#0B7A75", primaryLight:"#7AD9D2", primaryDark:"#075E59",
    accent:"#10B981",  accentLight:"#A7F3D0",  accentDark:"#059669",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F2FFFC",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#0EA5E9"
  },
  "ink": {
    primary:"#0A0A0A", primaryLight:"#374151", primaryDark:"#000000",
    accent:"#22D3EE",  accentLight:"#A5F3FC",  accentDark:"#0891B2",
    neutral:"#9CA3AF", surface:"#0B0F14", softSurface:"#111827",
    success:"#22C55E", warning:"#EAB308", danger:"#F87171", info:"#60A5FA"
  },
  "honey": {
    primary:"#EAB308", primaryLight:"#FDE68A", primaryDark:"#A16207",
    accent:"#F97316",  accentLight:"#FDBA74",  accentDark:"#EA580C",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF9EC",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "wave": {
    primary:"#0EA5E9", primaryLight:"#7DD3FC", primaryDark:"#0369A1",
    accent:"#22D3EE",  accentLight:"#A5F3FC",  accentDark:"#0891B2",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F3FAFF",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  },
  "terra": {
    primary:"#92400E", primaryLight:"#F59E0B", primaryDark:"#7C2D12",
    accent:"#22C55E",  accentLight:"#86EFAC",  accentDark:"#16A34A",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#FFF7F1",
    success:"#16A34A", warning:"#D97706", danger:"#DC2626", info:"#2563EB"
  },
  "ice-lilac": {
    primary:"#A78BFA", primaryLight:"#DDD6FE", primaryDark:"#7C3AED",
    accent:"#60A5FA",  accentLight:"#BFDBFE",  accentDark:"#2563EB",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F7F7FF",
    success:"#22C55E", warning:"#EAB308", danger:"#EF4444", info:"#6366F1"
  },
  "petrol": {
    primary:"#0F766E", primaryLight:"#5EEAD4", primaryDark:"#115E59",
    accent:"#06B6D4",  accentLight:"#BAE6FD",  accentDark:"#0E7490",
    neutral:"#6B7280", surface:"#FFFFFF", softSurface:"#F2FFFB",
    success:"#16A34A", warning:"#F59E0B", danger:"#EF4444", info:"#2563EB"
  }
} as const;

  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    public permissionService: PermissionService
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }
  
  ngOnInit() {
    // Initialize sidebar state - always start collapsed
    this.isSidebarCollapsed = true;
    
    // Detect screen size
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]).subscribe(result => {
      this.isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset);
      this.isTablet = this.breakpointObserver.isMatched(Breakpoints.Tablet);
      
      // On mobile or tablet, sidebar should be hidden (collapsed)
      if (this.isMobile || this.isTablet || window.innerWidth <= 960) {
        this.isSidebarCollapsed = true;
      }
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    }
  }
  
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  /**
   * Handle sidenav closed event (for mobile overlay mode)
   */
  onSidenavClosed(): void {
    // On mobile, when user clicks outside, set as collapsed
    this.isHandset$.subscribe(isHandset => {
      if (isHandset) {
        this.isSidebarCollapsed = true;
      }
    });
  }
  
  /**
   * Handle menu item click - close sidebar on mobile/tablet only
   */
  onMenuItemClick(): void {
    // Check if on mobile or tablet (max-width: 960px)
    if (this.isMobileOrTablet()) {
      this.isSidebarCollapsed = true;
    }
    // On desktop, keep sidebar in current state (collapsed or expanded)
  }
  
  /**
   * Check if current view is mobile or tablet
   */
  isMobileOrTablet(): boolean {
    return window.innerWidth <= 960;
  }
  
  onThemeChange(theme: string) {
    this.applyTheme(theme);
    localStorage.setItem('selectedTheme', theme);
  }
  
  applyTheme(themeName: string) {
    const theme = this.themes[themeName as keyof typeof this.themes];
    if (theme) {
      const root = document.documentElement;
      
      // Update CSS variables
      root.style.setProperty('--primary-color', theme.primary);
      root.style.setProperty('--primary-light', theme.primaryLight);
      root.style.setProperty('--primary-dark', theme.primaryDark);
      root.style.setProperty('--accent-color', theme.accent);
      root.style.setProperty('--accent-light', theme.accentLight);
      root.style.setProperty('--accent-dark', theme.accentDark);
      
      // Update Material toolbar background dynamically
      const toolbar = document.querySelector('.app-header') as HTMLElement;
      if (toolbar) {
        toolbar.style.backgroundColor = theme.primary;
      }
      
      // Force update active sidebar items
      const activeItems = document.querySelectorAll('.mat-mdc-list-item.active');
      activeItems.forEach((item: any) => {
        item.style.backgroundColor = `${theme.primary}1A`; // 10% opacity
        item.style.color = theme.primary;
        const icon = item.querySelector('mat-icon');
        if (icon) {
          icon.style.color = theme.primary;
        }
      });
      
      // Update hover effect on sidebar items
      this.updateSidebarStyles(theme);
    }
  }
  
  updateSidebarStyles(theme: any) {
    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.innerHTML = `
      .mat-mdc-list-item.active {
        background-color: ${theme.primary}1A !important;
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-list-item.active mat-icon {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-list-item:hover {
        background-color: ${theme.primary}0D !important;
      }
      
      .mat-toolbar.mat-primary,
      .app-header {
        background-color: ${theme.primary} !important;
      }
      
      .mat-mdc-raised-button.mat-primary,
      .mat-mdc-unelevated-button.mat-primary {
        background-color: ${theme.primary} !important;
      }
      
      .mat-mdc-raised-button.mat-accent,
      .mat-mdc-unelevated-button.mat-accent {
        background-color: ${theme.accent} !important;
      }
      
      .export-btn {
        border-color: ${theme.primary} !important;
        color: ${theme.primary} !important;
      }
      
      .export-btn:hover {
        background-color: ${theme.primary} !important;
        color: white !important;
      }
      
      .mat-mdc-progress-spinner circle {
        stroke: ${theme.primary} !important;
      }
      
      /* Form fields and inputs */
      .mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mdc-notched-outline .mdc-notched-outline__leading,
      .mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mdc-notched-outline .mdc-notched-outline__notch,
      .mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mdc-notched-outline .mdc-notched-outline__trailing {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__leading,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__notch,
      .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__trailing {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label,
      .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-form-field.mat-form-field-appearance-outline.mat-focused .mdc-floating-label {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-select-arrow {
        color: ${theme.primary} !important;
      }
      
      /* All form field labels */
      .mat-mdc-form-field .mdc-floating-label--float-above {
        color: ${theme.primary} !important;
      }
      
      .mat-mdc-option.mat-mdc-option-active,
      .mat-mdc-option:hover:not(.mat-mdc-option-disabled) {
        background-color: ${theme.primary}1A !important;
      }
      
      .mat-mdc-option.mat-selected:not(.mat-mdc-option-multiple) {
        background-color: ${theme.primary}1A !important;
        color: ${theme.primary} !important;
      }
      
      .mat-primary .mat-pseudo-checkbox-checked,
      .mat-primary .mat-pseudo-checkbox-indeterminate {
        background-color: ${theme.primary} !important;
      }
      
      /* Checkbox and radio buttons */
      .mat-mdc-checkbox.mat-accent .mdc-checkbox__native-control:enabled:checked~.mdc-checkbox__background,
      .mat-mdc-checkbox.mat-accent .mdc-checkbox__native-control:enabled:indeterminate~.mdc-checkbox__background {
        background-color: ${theme.primary} !important;
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-radio-button.mat-accent .mdc-radio__native-control:enabled:checked+.mdc-radio__background .mdc-radio__outer-circle {
        border-color: ${theme.primary} !important;
      }
      
      .mat-mdc-radio-button.mat-accent .mdc-radio__native-control:enabled+.mdc-radio__background .mdc-radio__inner-circle {
        border-color: ${theme.primary} !important;
      }
      
      /* Slider */
      .mat-mdc-slider.mat-accent {
        --mdc-slider-handle-color: ${theme.primary};
        --mdc-slider-focus-handle-color: ${theme.primary};
        --mdc-slider-hover-handle-color: ${theme.primary};
        --mdc-slider-active-track-color: ${theme.primary};
        --mdc-slider-inactive-track-color: ${theme.primary};
      }
      
      /* Links */
      a:not(.mat-mdc-button):not(.mat-mdc-list-item) {
        color: ${theme.primary} !important;
      }
    `;
  }
  
  /**
   * Logout user
   */
  onLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe({
        next: (response) => {
          if (response.success) {
            this.errorHandler.showSuccess('Logged out successfully');
            // Redirect is handled by clearSession in auth service
          }
        },
        error: (error) => {
          // Session is cleared even on error
          this.errorHandler.showInfo('Logged out');
        }
      });
    }
  }
  
  /**
   * Navigate to profile
   */
  onProfile(): void {
    this.router.navigate(['/profile']);
  }
  
  /**
   * Navigate to settings
   */
  onSettings(): void {
    this.router.navigate(['/settings']);
  }
  
  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'User';
  }
  
  /**
   * Get user email
   */
  getUserEmail(): string {
    const user = this.authService.currentUser();
    return user?.email || '';
  }
  
  /**
   * Get user role
   */
  getUserRole(): string {
    const user = this.authService.currentUser();
    return user?.role || '';
  }
}

