import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

@Component({
  selector: 'app-inventory-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './inventory-shell.component.html',
  styleUrls: ['./inventory-shell.component.scss']
})
export class InventoryShellComponent {}
