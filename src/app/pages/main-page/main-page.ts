import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { GeneralSettingsService } from '../../_services/general-settings/general-settings-service';

@Component({
  selector: 'app-main-page',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, RouterLink],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage implements OnInit {
  private readonly generalSettingsService = inject(GeneralSettingsService);

  registrationClosed = false;

  ngOnInit(): void {
    this.generalSettingsService.isRegistrationClosed().subscribe(closed => {
      this.registrationClosed = closed;
    });
  }
}
