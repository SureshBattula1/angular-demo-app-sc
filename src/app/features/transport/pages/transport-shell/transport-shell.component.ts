import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

@Component({
  selector: 'app-transport-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  template: `
    <div class="transport-shell">
      <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="transport-tabs">
        <a mat-tab-link routerLink="vehicles" routerLinkActive #v="routerLinkActive" [active]="v.isActive">
          <mat-icon>directions_bus</mat-icon> Vehicles
        </a>
        <a mat-tab-link routerLink="drivers" routerLinkActive #d="routerLinkActive" [active]="d.isActive">
          <mat-icon>badge</mat-icon> Drivers
        </a>
        <a mat-tab-link routerLink="routes" routerLinkActive #r="routerLinkActive" [active]="r.isActive">
          <mat-icon>alt_route</mat-icon> Routes
        </a>
      </nav>
      <mat-tab-nav-panel #tabPanel>
        <div class="tab-body"><router-outlet></router-outlet></div>
      </mat-tab-nav-panel>
    </div>
  `,
  styles: [`
    .transport-shell { display: block; }
    .transport-tabs { background: var(--card-background, #fff); }
    .transport-tabs a { display: inline-flex; align-items: center; gap: 6px; }
    .tab-body { padding: 16px; }
    @media (max-width: 600px) { .tab-body { padding: 8px; } }
  `]
})
export class TransportShellComponent {}
