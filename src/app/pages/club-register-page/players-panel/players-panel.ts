import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { filter, take } from 'rxjs';
import { MatCard } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PersonData, PlayerData } from '../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { MatDialog } from '@angular/material/dialog';
import { PriceService } from '../../../_services/shared/price/price-service';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlayerDialog } from '../player-dialog/player-dialog';

export type PlayerRow = PlayerData & { fee: number };

@Component({
  selector: 'app-players-panel',
  imports: [MatTableModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, CurrencyPipe],
  templateUrl: './players-panel.html',
  styleUrl: './players-panel.scss'
})
export class PlayersPanel implements OnChanges {
  @Output() countChange = new EventEmitter<number>();
  @Output() playersPrice = new EventEmitter<number>();
  @Output() playersChange = new EventEmitter<PlayerRow[]>();
  @Input() initialRows: PlayerRow[] | null = null;
  @Input() familyMode = false;
  @Input() readOnly = false;

  displayedColumns: string[] = ['rowNumber', 'firstname', 'lastname', 'birthYear', 'category', 'games', 'supperFri', 'nightFriSat', 'dinnerSat', 'supperSat', 'nightSatSun', 'dinnerSun', 'fee', 'actions'];

  dataSource = new MatTableDataSource<PlayerRow>([]);
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
    const dialogRef = this.dialog.open(PlayerDialog, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '96vh',
      disableClose: true,
      data: {
        familyMode: this.familyMode,
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

    dialogRef.afterClosed().subscribe((result?: PlayerData) => {
      if (!result) return;
      const fee = this.computeFee(result);
      this.dataSource.data = [...this.dataSource.data, { ...result, fee }];
      this.emit();
    });
  }

  editUser(item: PlayerRow): void {
    if (this.readOnly) return;
    const dialogRef = this.dialog.open(PlayerDialog, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '96vh',
      disableClose: true,
      data: { edit: true, familyMode: this.familyMode, ...item },   // pass current row incl. id
    });

    dialogRef.afterClosed().subscribe((result?: PlayerData) => {
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

  delete(item: PlayerRow): void {
    if (this.readOnly) return;
    if (!confirm(`Usunąć zawodnika ${item.firstname} ${item.lastname}?`)) return;
    const next = this.dataSource.data.filter(r => (item.id ? r.id !== item.id : r !== item));
    this.dataSource.data = next;
    this.emit();
  }

  private computeFee(v: PlayerData): number {
    return this.priceService.calculateTotalPlayer({
      category: v.category,
      games: v.games,
      nights: { friSat: v.nightFriSat, satSun: v.nightSatSun },
      meals: { supperFri: v.supperFri, dinnerSat: !!v.dinnerSat, supperSat: v.supperSat, dinnerSun: v.dinnerSun }
    });
  }

  private emit() {
    const rows = this.dataSource.data.map(r => ({
      ...r,
      fee: this.computeFee(r),
    }));
    this.dataSource.data = rows;
    this.countChange.emit(rows.length);
    this.playersPrice.emit(rows.reduce((s, r) => s + (r.fee ?? 0), 0));
    this.playersChange.emit(rows);
  }

  private x_emit() {
    this.countChange.emit(this.dataSource.data.length);
    const total = this.dataSource.data.reduce((sum, r) => sum + (r.fee ?? 0), 0);
    this.playersPrice.emit(total);
    this.playersChange.emit([...this.dataSource.data]);
  }
}
