import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/modules/material/material.module';

@Component({
  selector: 'app-library-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './library-shell.component.html',
  styleUrls: ['./library-shell.component.scss']
})
export class LibraryShellComponent {}
