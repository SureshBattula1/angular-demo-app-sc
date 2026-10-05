import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

@Component({
  selector: 'app-transport-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './transport-shell.component.html',
  styleUrls: ['./transport-shell.component.scss']
})
export class TransportShellComponent {}
