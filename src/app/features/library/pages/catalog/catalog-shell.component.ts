import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

@Component({
  selector: 'app-catalog-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './catalog-shell.component.html',
  styleUrls: ['./catalog-shell.component.scss']
})
export class CatalogShellComponent {}
