// src/app/_services/general-settings/general-settings-storage-service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { GeneralSettingsService } from './general-settings-service';

export type BillSettingsKeys =
  | 'bill_owner_line_1'
  | 'bill_owner_line_2'
  | 'bill_owner_line_3'
  | 'bill_owner_line_4'
  | 'bill_owner_line_5'
  | 'bill_number_suffix'
  | 'bill_default_payment_desc_line_1'
  | 'bill_default_payment_desc_line_2'
  | 'bill_default_payment_desc_line_3'
  | 'bill_account_number'
  | 'bill_account_transfer';

export interface BillSettings {
  bill_owner_line_1: string;
  bill_owner_line_2: string;
  bill_owner_line_3: string;
  bill_owner_line_4: string;
  bill_owner_line_5: string;
  bill_number_suffix: string;
  bill_default_payment_desc_line_1: string;
  bill_default_payment_desc_line_2: string;
  bill_default_payment_desc_line_3: string;
  bill_account_number: string;
  bill_account_transfer: string;
}

const KEYS: readonly BillSettingsKeys[] = [
  'bill_owner_line_1',
  'bill_owner_line_2',
  'bill_owner_line_3',
  'bill_owner_line_4',
  'bill_owner_line_5',
  'bill_number_suffix',
  'bill_default_payment_desc_line_1',
  'bill_default_payment_desc_line_2',
  'bill_default_payment_desc_line_3',
  'bill_account_number',
  'bill_account_transfer',
] as const;

@Injectable({ providedIn: 'root' })
export class GeneralSettingsStorageService {
  private readonly api = inject(GeneralSettingsService);

  private readonly billSettingsSubject = new BehaviorSubject<BillSettings | null>(null);
  readonly billSettings$ = this.billSettingsSubject.asObservable();

  /** Idempotent: loads once, pushes into subject, caches via shareReplay. */
  prefetchBillSettings(): Observable<BillSettings> {
    const cached = this.billSettingsSubject.value;
    if (cached) {
      // already loaded
      return of(cached);
    }

    const requests: { [K in BillSettingsKeys]: Observable<string> } = {} as any;
    for (const k of KEYS) {
      requests[k] = this.api.findByKey1(k).pipe(
        map((res: any) => {
          // backend returns { data: string }
          if (res && typeof res === 'object') {
            return (res.data ?? res.value ?? ''); // prefer .data, fallback .value, else ''
          }
          return String(res ?? '');
        }),
        catchError(() => of(''))
      );
    }

    return forkJoin(requests).pipe(
      map(vals => vals as BillSettings),
      tap(vals => {
        // **THIS** saves it in the storage
        this.billSettingsSubject.next(vals);
        // optional: console.debug('Saved BillSettings in storage', vals);
      }),
      shareReplay(1)
    );
  }

  /** Synchronous snapshot (null until prefetch completes). */
  getBillSettingsSnapshot(): BillSettings | null {
    return this.billSettingsSubject.value;
  }

  /** Force reload from backend. */
  refreshBillSettings(): Observable<BillSettings> {
    this.billSettingsSubject.next(null);
    return this.prefetchBillSettings();
  }
}
