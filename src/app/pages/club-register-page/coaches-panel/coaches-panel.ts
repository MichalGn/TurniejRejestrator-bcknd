import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { filter, take } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CoachDialog } from '../coach-dialog/coach-dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PersonData } from '../../../_services/shared/registration/registration-service';
import { CurrencyPipe } from '@angular/common';
import { PriceService } from '../../../_services/shared/price/price-service';

export type CoachRow = PersonData & { fee: number };

@Component({
  selector: 'app-coaches-panel',
  imports: [MatTableModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, CurrencyPipe],
  templateUrl: './coaches-panel.html',
  styleUrl: './coaches-panel.scss'
})
export class CoachesPanel implements OnChanges {
  @Output() countChange = new EventEmitter<number>();
  @Output() coachesPrice = new EventEmitter<number>();
  @Output() coachesChange = new EventEmitter<CoachRow[]>();
  @Input() initialRows: CoachRow[] | null = null;
  @Input() familyMode = false;
  @Input() readOnly = false;
  @Input() personLabel = 'trenera';
  @Input() personLabelTitle = 'trenera';

  displayedColumns: string[] = ['rowNumber', 'firstname', 'lastname', 'supperFri', 'nightFriSat', 'dinnerSat', 'supperSat', 'nightSatSun', 'dinnerSun', 'fee', 'actions'];

  dataSource = new MatTableDataSource<CoachRow>([]);
  loading = false;
  private snackbar = inject(SnackbarService);
  readonly dialog = inject(MatDialog);
  private priceService = inject(PriceService);

  constructor() {
    // Prices are loaded asynchronously. During edit mode the rows may be
    // displayed before PriceService has finished loading its settings,
    // which previously left the fee at 0. Recalculate once prices are ready.
    this.priceService.loaded$
      .pipe(filter(loaded => loaded), take(1))
      .subscribe(() => {
        if (this.dataSource.data.length > 0) {
          this.emit();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialRows'] && this.initialRows) {
      this.dataSource.data = this.initialRows.map(row => ({ ...row, fee: row.fee ?? this.computeFee(row) }));
      this.emit();
    }
  }

  openDialog(): void {
    if (this.readOnly) return;
    const dialogRef = this.dialog.open(CoachDialog, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        familyMode: this.familyMode,
        personLabelTitle: this.personLabelTitle,
        firstname: '',
        lastname: '',
        supperFri: false,
        nightFriSat: false,
        dinnerSat: false,
        supperSat: false,
        nightSatSun: false,
        dinnerSun: false,
        fee: 0
      },
    });

    dialogRef.afterClosed().subscribe((result?: PersonData) => {
      if (!result) return;
      const fee = this.computeFee(result);
      this.dataSource.data = [...this.dataSource.data, { ...result, fee }]; 
      this.emit();
    });
  }

  editUser(item: CoachRow): void {
    if (this.readOnly) return;
    const dialogRef = this.dialog.open(CoachDialog, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data: { edit: true, familyMode: this.familyMode, personLabelTitle: this.personLabelTitle, ...item },   // pass current row incl. id
    });

    dialogRef.afterClosed().subscribe((result?: PersonData) => {
      if (!result) return;

      const data = this.dataSource.data;
      const idx = result.id
        ? data.findIndex(r => r.id === result.id)
        : data.findIndex(r => r.firstname === item.firstname && r.lastname === item.lastname);

      if (idx > -1) {
        const fee = this.computeFee(result); // ✅ recompute on edit
        data[idx] = { ...data[idx], ...result, fee };
        this.dataSource.data = [...data];
        this.emit();
      }
    });
  }

  delete(item: CoachRow): void {
    if (this.readOnly) return;
    if (!confirm(`Usunąć ${this.personLabel} ${item.firstname} ${item.lastname}?`)) return;
    const next = this.dataSource.data.filter(r => (item.id ? r.id !== item.id : r !== item));
    this.dataSource.data = next;
    this.emit();
  }

  private computeFee(v: PersonData): number {
    return this.priceService.calculateTotalCoach({
      gender: v.gender,
      nights: { friSat: v.nightFriSat, satSun: v.nightSatSun },
      meals: { supperFri: v.supperFri, dinnerSat: v.dinnerSat, supperSat: v.supperSat, dinnerSun: v.dinnerSun }
    });
  }

  private emit() {
    const rows = this.dataSource.data.map(r => ({
      ...r,
      fee: this.computeFee(r),
    }));
    this.dataSource.data = rows;
    this.countChange.emit(rows.length);
    const total = rows.reduce((sum, r) => sum + (r.fee ?? 0), 0);
    this.coachesPrice.emit(total);
    this.coachesChange.emit([...rows]);
  }
}
