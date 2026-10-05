import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-transport-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './transport-shell.component.html',
  styleUrls: ['./transport-shell.component.scss']
})
export class TransportShellComponent implements OnInit {
  constructor(public auth: AuthService, private router: Router) {}

  get isDriver(): boolean {
    return this.auth.currentUser()?.role === 'Driver';
  }

  ngOnInit(): void {
    if (this.isDriver && (this.router.url === '/transport' || this.router.url === '/transport/dashboard')) {
      this.router.navigate(['/transport/driver-portal']);
    }
  }
}
