import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, OnInit } from '@angular/core'; // <-- OnInit
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, Subject, Subscription, takeUntil } from 'rxjs';
import { RegistrationService, RegistrationStatusCounts } from '../../../_services/shared/registration/registration-service';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { GeneralSettingsService } from '../../../_services/general-settings/general-settings-service';
import { GeneralSettingsStorageService } from '../../../_services/general-settings/general-settings-storage-service';
import { BillService } from '../../../_services/bill/bill-service';


@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonToggleModule, FormsModule, MatSidenavModule, MatListModule, MatIconModule, RouterModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatButtonModule, MatBadgeModule
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit {
  isHandset = false;
  private destroy$ = new Subject<void>();
  private childSub?: Subscription;
  private settingsStore = inject(GeneralSettingsStorageService);
  loading = false;
  billCnt = 0;

  // ✅ counts available to the template (e.g., for a badge)
  statusCnts: RegistrationStatusCounts = {
    unverifiedCnt: 0,
    verifiedCnt: 0,
    removedCnt: 0,
    allCnt: 0,
    coachesCnt: 0,
    playersCnt: 0
  };


  constructor(
    private bp: BreakpointObserver,
    private registrationService: RegistrationService,
    private billService: BillService,
    // private snackbar: SnackbarService,
  ) {
    this.bp.observe(['(max-width: 900px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => this.isHandset = state.matches);
  }

  ngOnInit(): void {
    this.refreshCounts();
    this.loading = true;
    this.settingsStore
      .prefetchBillSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vals) => {
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private refreshCounts(): void {
    this.billService.count()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (billCnt) => this.billCnt = billCnt,
        error: (e) => {
          console.error('Błąd w odczycie licznika rachunków', e);
        }
      });

    this.registrationService.countByStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cnts) => this.statusCnts = cnts ?? this.statusCnts,
        error: (e) => {
          console.error('Błąd w odczycie liczników statusów', e);
        }
      });
  }

  onChildActivate(component: any) {
    // If the activated routed component exposes the event, subscribe
    this.childSub?.unsubscribe();
    if (component?.statusChanged?.subscribe) {
      this.childSub = component.statusChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.refreshCounts()); 
    }
  }

  ngOnDestroy() {
    this.childSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
