import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-panel',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './header-panel.html',
  styleUrl: './header-panel.scss'
})
export class HeaderPanel {

}
