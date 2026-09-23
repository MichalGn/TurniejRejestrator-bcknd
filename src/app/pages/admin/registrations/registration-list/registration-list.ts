import { AfterViewInit, Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RegistrationService, RegistrationSummary } from '../../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ListHeader } from "../../../../shared/list-header/list-header";
import { CommonModule } from '@angular/common';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { LabelValue } from "../../../../shared/label-value/label-value";
import { MatMenu, MatMenuModule } from "@angular/material/menu";
import { catchError, forkJoin, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable, { CellDef, RowInput } from 'jspdf-autotable';
import '../../../../../../public/fonts/Roboto-Regular-normal.js';
import '../../../../../../public/fonts/Roboto-Bold-normal.js';
import { MatDivider } from "@angular/material/divider";
import { BillDialog } from '../../bills/bill-dialog/bill-dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BillData } from '../../../../_services/bill/bill-service';

export enum RegistrationStatus {
  Unverified = 'unverified',
  Verified = 'verified',
  Removed = 'removed'
}

const TITLES: Record<RegistrationStatus, string> = {
  [RegistrationStatus.Unverified]: 'Zgłoszenia niezweryfikowane',
  [RegistrationStatus.Verified]: 'Zgłoszenia zweryfikowane',
  [RegistrationStatus.Removed]: 'Zgłoszenia usunięte',
};

// add near the top of the file
type RegistrationListRow = RegistrationSummary & {
  city?: string;
  phone?: string;
  // the API may give you arrays OR precomputed counts — support both:
  coaches?: any[];
  players?: any[];
  coachesQnt?: number;
  playersQnt?: number;
  registrationType?: string;
  uuid?: string;
};

@Component({
  selector: 'app-registration-list',
  standalone: true,
  templateUrl: './registration-list.html',
  styleUrls: ['./registration-list.scss'],
  imports: [CommonModule, MatProgressSpinnerModule, ListHeader, MatTableModule, MatSortModule, MatIconModule, MatButtonModule, LabelValue, MatMenuModule, MatDivider]
})
export class RegistrationList implements AfterViewInit {

  /** Notifies parent shell (HomePage) to refresh counters */
  @Output() statusChanged = new EventEmitter<void>();
  @ViewChild(MatSort) sort!: MatSort;

  status!: RegistrationStatus;
  title: string = 'Zgłoszenia';
  service = inject(RegistrationService);
  loading = false;
  private snackbar = inject(SnackbarService);
  items: RegistrationSummary[] = [];
  displayedColumns: string[] = ['rowNumber', 'clubName', 'city', 'email', 'phone', 'coachesQnt', 'playersQnt', 'expand'];
  // coachesColumns: string[] = ['firstName', 'lastName', 'gender', 'supper_fri', 'night_fri_sat', 'dinner_sat', 'suppe_sat', 'night_sat_sun', 'dinner_sun', 'price_pln'];

  ///dataSource = new MatTableDataSource<RegistrationSummary>([]);
  dataSource = new MatTableDataSource<RegistrationListRow>([]);
  expandedElement: RegistrationSummary | null = null;
  //statusCnts: RegistrationStatusCounts = DEFAULT_COUNTS;
  readonly dialog = inject(MatDialog);

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  constructor(private route: ActivatedRoute) {
    this.route.data.subscribe({
      next: data => {
        this.status = data['status'] as RegistrationStatus;
        this.title = TITLES[this.status] ?? 'Zgłoszenia';
        this.fetch();
      },
      error: e => this.snackbar.showError('Błąd odczytu parametrów trasy', e)
    });
  }

  private fetch(): void {
    this.loading = true;
    this.service.findListByStatus(this.status).subscribe({
      next: (data) => {
        const rows: RegistrationListRow[] = Array.isArray(data)
          ? data
          : ((data as any)?.items ?? []);
        this.dataSource = new MatTableDataSource<RegistrationListRow>([...rows]);
        if (this.sort) this.dataSource.sort = this.sort;
        // const rows = Array.isArray(data)
        //   ? data
        //   : (data as any)?.items ?? [];

        // this.items = rows;

        // // Use a fresh MatTableDataSource instance (avoids stale instance issues)
        // this.dataSource = new MatTableDataSource<RegistrationSummary>([...rows]);
        // if (this.sort) this.dataSource.sort = this.sort;
      },
      error: (e) => {
        this.snackbar.showError('Błąd w odczycie zgłoszeń', e);
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }

  handleDataSourceChanged(updatedDataSource: MatTableDataSource<RegistrationSummary>): void {
    // this.dataSource = updatedDataSource;
  }

  handleLoadingChanged(loading: boolean): void {
    this.loading = loading;
    //this.cdr.detectChanges();
  }

  /** Checks whether an element is expanded. */
  isExpanded(element: any) {
    return this.expandedElement === element;
  }

  /** Toggles the expanded state of an element. */
  toggle(element: any) {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

  rowNumber(row: RegistrationSummary): number {
    // Start from filtered data (what mat-table uses)
    const base = this.dataSource.filteredData.slice();

    // Apply current sort (so numbering matches UI order)
    const ordered = this.dataSource.sort
      ? this.dataSource.sortData(base, this.dataSource.sort)
      : base;

    const idx = ordered.indexOf(row);
    if (idx === -1) return 0;

    // Reverse numbering: last row -> 1
    return ordered.length - idx;
  }

  getRoom(registration: RegistrationListRow, gender: string): string {
    const registrationType = (
      registration.registrationType
      ?? (registration as any).registration_type
      ?? ''
    ).toUpperCase();

    if (registrationType === 'FAMILY') {
      return 'rodzinny';
    }

    switch (gender) {
      case 'm': return 'męski';
      case 'f': return 'damski';
      case 's': return 'jednoosobowy';
      default: return '—';
    }
  }

  hasDinnerSat(player: any): boolean {
    // KT and GP have Saturday lunch included by definition.
    // For ZAK the value comes from the explicit user choice.
    if ((player?.category ?? '').toUpperCase() !== 'ZAK') {
      return true;
    }

    return player?.dinnerSat === true
      || player?.personSpec?.dinnerSat === true;
  }

  getGender(gender: string): string {
    switch (gender) {
      case 'm': return "mężczyzna";
      case 'f': return "kobieta";
      default: return "?";
    }
  }

  getStatus(gender: string): string {
    switch (gender) {
      case 'u': return "niezweryfikowane";
      case 'v': return "zweryfikowane";
      case 'r': return "usunięte";
      default: return "?";
    }
  }

  toDateFromArray(arr?: number[] | null): Date | null {
    if (!arr || arr.length < 3) return null;
    const [y, m, d, h = 0, min = 0, s = 0, ns = 0] = arr;
    return new Date(y, m - 1, d, h, min, s, Math.floor(ns / 1e6));

    // If you must treat it as UTC instead:
    // return new Date(Date.UTC(y, m - 1, d, h, min, s, Math.floor(ns / 1e6)));
  }

  formatAddress(row: any): string {
    const street = row.streetNo ?? row.streeetNo ?? ''; // handle both spellings
    const zip = row.zipCode ?? row.zip ?? '';
    const city = row.city ?? '';
    const right = [zip, city].filter(Boolean).join(' ');
    return [street, right].filter(Boolean).join(', ');
  }

  isRemovedRegistration(row: RegistrationListRow): boolean {
    const status = String((row as any)?.status ?? '').trim().toLowerCase();
    return status === 'r' || status === 'removed';
  }

  openRegistrationForm(row: RegistrationListRow): void {
    if (!row.uuid) {
      this.snackbar.showWarning('Brak linku do formularza dla tego zgłoszenia.');
      return;
    }

    const type = (row.registrationType ?? '').toUpperCase();
    const path = type === 'FAMILY'
      ? `/familyRegister/edit/${row.uuid}`
      : type === 'CLUB'
        ? `/clubRegister/edit/${row.uuid}`
        : `/individualRegister/edit/${row.uuid}`;

    const opened = window.open(path, '_blank');
    if (opened) opened.opener = null;
  }

  onUnverify(row: RegistrationSummary) {
    this.changeStatus(row.registrationId, RegistrationStatus.Unverified);
  }

  onVerify(row: RegistrationSummary) {
    this.changeStatus(row.registrationId, RegistrationStatus.Verified);
  }

  onRemove(row: RegistrationSummary) {
    this.changeStatus(row.registrationId, RegistrationStatus.Removed);
  }

  onCreateBill(row: RegistrationSummary) {
    console.log("registrationSummaryyyyy:", row)

    const dialogRef = this.dialog.open(BillDialog, {
      disableClose: true,
      data: {
        registrationId: row.registrationId,
        billId: null,
      },
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',

      // add a panel class if you want custom CSS too
      // panelClass: 'bill-dialog-panel',
      panelClass: 'bill-dialog-fill',
    });

    /*
    this.loading = false;
    this.service.findById(row.registrationId).subscribe({
      next: (data: RegistrationSummary) => {



        this.dialog.open(BillDialog, {
          disableClose: true,
          data: billData,                 // <-- pass the exact shape it needs
          width: '1000px',
          maxWidth: '95vw',
          maxHeight: '95vh',
          panelClass: 'bill-dialog-fill',
        });


        /*
        this.loading = false;
        const dialogRef = this.dialog.open(BillDialog, {
          disableClose: true,
          data: { 
            data,
          },
          width: '1000px',
          maxWidth: '95vw',
          height: 'auto',
          maxHeight: '95vh',

          // add a panel class if you want custom CSS too
          // panelClass: 'bill-dialog-panel',
          panelClass: 'bill-dialog-fill',
        });
        */
    /*
   },
   error: e => {
     this.loading = false;
     this.snackbar.showError(`Błąd w odczycie rejestracji`, e);
   },
   complete: () => {
     this.loading = false;
   },
 });
*/
  }

  private changeStatus(registrationId: number, status: RegistrationStatus,
    msgOk: string = "Zgłoszenie poprawnie zmodyfikowane",
    msgErr: string = "Błąd w modyfikacji zgłoszenia") {
    this.loading = true;
    this.service.updateStatus(registrationId, status).subscribe({
      next: () => {
        this.snackbar.showSuccess(`${msgOk}`);
        this.statusChanged.emit();
      },
      error: e => {
        this.loading = false;
        this.snackbar.showError(`${msgErr}`, e);
      },
      complete: () => {
        this.loading = false;
        this.fetch();
      },
    });
  }

  handleExportToCsvFile() {
    // rows as shown (filtered + sorted)
    const base = this.dataSource.filteredData.slice();
    const rows: RegistrationListRow[] =
      this.dataSource.sort ? this.dataSource.sortData(base, this.dataSource.sort) : base;

    if (!rows.length) {
      this.snackbar.showWarning('Brak danych do eksportu.');
      return;
    }

    // CSV helpers
    const SEP = ';';
    const esc = (v: any) => {
      const s = (v ?? '').toString();
      return (s.includes('"') || s.includes('\n') || s.includes(SEP))
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const tick = (v: any) => (v ? '✓' : '');
    const price = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : '—';
    };
    const whenStr = (arr?: number[] | null) => {
      const dt = this.toDateFromArray(arr);
      return dt
        ? new Intl.DateTimeFormat('pl-PL', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(dt)
        : '—';
    };

    // Columns: main (left) + nested (right)
    const header = [
      'Lp.',
      'Klub',
      'Adres',
      'NIP',
      'Osoba rejestrująca',
      'Cena całkowita [PLN]',

      'Sekcja',           // Trenerzy | Zawodnicy | Status
      'Imię',
      'Nazwisko',
      'Pokój',            // tylko dla trenerów
      'Rok ur.',          // tylko dla zawodników
      'Płeć',             // dla zawodników (mężczyzna/kobieta)
      'Kategoria',        // dla zawodników
      'Liczba gier',      // dla zawodników
      'Kolacja Pt',
      'Noc Pt/Sb',
      'Obiad Sb',
      'Kolacja Sb',
      'Noc Sb/Nd',
      'Obiad Nd',
      'Cena [PLN]',
      'Data i czas',      // tylko dla Status
      'Status',           // tylko dla Status
      'Uwagi'             // tylko dla Status
    ];

    const out: string[] = [];
    const filter = (this.dataSource.filter || '').trim();
    if (filter) {
      out.push(esc(`Filtr: ${filter} — wyników: ${rows.length} / ${this.dataSource.data.length}`));
      out.push(''); // empty line
    }
    out.push(header.map(esc).join(SEP));

    // Emit one CSV row per nested item, repeating the main-left fields
    rows.forEach((r, idx) => {
      const left = [
        idx + 1,
        r.clubName ?? '—',
        this.formatAddress(r) || '—',
        (r as any).nip ?? '—',
        (r as any).registratorName ?? '—',
        price((r as any).totalPrice),
      ].map(esc);

      // --- Trenerzy ---
      {
        const coaches = Array.isArray((r as any).coaches) ? (r as any).coaches : [];
        if (coaches.length) {
          for (const c of coaches) {
            const row = [
              ...left,
              esc('Trenerzy'),
              esc(c?.personSpec?.firstname ?? ''),
              esc(c?.personSpec?.lastname ?? ''),
              esc(this.getRoom(r, c?.personSpec?.gender ?? '')), // Pokój
              '', // Rok ur.
              '', // Płeć
              '', // Kategoria
              '', // Liczba gier
              esc(tick(c?.personSpec?.supperFri)),
              esc(tick(c?.personSpec?.nightFriSat)),
              esc(tick(c?.dinnerSat)),
              esc(tick(c?.personSpec?.supperSat)),
              esc(tick(c?.personSpec?.nightSatSun)),
              esc(tick(c?.personSpec?.dinnerSun)),
              esc(price(c?.personSpec?.price)),
              '', // Data i czas
              '', // Status
              ''  // Uwagi
            ];
            out.push(row.join(SEP));
          }
        } else {
          // Emit a single "no items" line to mirror the PDF
          const row = [
            ...left,
            esc('Trenerzy'),
            esc('Brak pozycji'),
            '', '', '', '', '', '',
            '', '', '', '', '', '',
            '', '', ''
          ];
          out.push(row.join(SEP));
        }
      }

      // --- Zawodnicy ---
      {
        const players = Array.isArray((r as any).players) ? (r as any).players : [];
        if (players.length) {
          for (const p of players) {
            const row = [
              ...left,
              esc('Zawodnicy'),
              esc(p?.personSpec?.firstname ?? ''),
              esc(p?.personSpec?.lastname ?? ''),
              '', // Pokój
              esc(p?.birthYear ?? ''),
              esc(this.getGender(p?.personSpec?.gender ?? '')),
              esc(p?.category ?? ''),
              esc(p?.games ?? ''),
              esc(tick(p?.personSpec?.supperFri)),
              esc(tick(p?.personSpec?.nightFriSat)),
              esc(tick(this.hasDinnerSat(p))),
              esc(tick(p?.personSpec?.supperSat)),
              esc(tick(p?.personSpec?.nightSatSun)),
              esc(tick(p?.personSpec?.dinnerSun)),
              esc(price(p?.personSpec?.price)),
              '', '', '' // Data i czas / Status / Uwagi
            ];
            out.push(row.join(SEP));
          }
        } else {
          const row = [
            ...left,
            esc('Zawodnicy'),
            esc('Brak pozycji'),
            '', '', '', '', '', '',
            '', '', '', '', '', '',
            '', '', ''
          ];
          out.push(row.join(SEP));
        }
      }

      // --- Status ---
      {
        const statuses = Array.isArray((r as any).statuses) ? (r as any).statuses : [];
        if (statuses.length) {
          for (const s of statuses) {
            const row = [
              ...left,
              esc('Status'),
              '', '', '', '', '', '', '', '', '', '', '', '', '', // nested cols not used here
              '', // Cena [PLN]
              esc(whenStr(s?.datetime)),
              esc(this.getStatus(s?.status ?? '')),
              esc(s?.comment ?? '')
            ];
            out.push(row.join(SEP));
          }
        } else {
          const row = [
            ...left,
            esc('Status'),
            esc('Brak pozycji'),
            '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', // Cena [PLN]
            '', '', ''
          ];
          out.push(row.join(SEP));
        }
      }

      // spacer line between registrations
      out.push('');
    });

    // Compose CSV with BOM for Excel + PL diacritics
    const csv = '\uFEFF' + out.join('\r\n');

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const filename =
      `rejestracje_szczegoly_${this.status}_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    this.snackbar.showSuccess('Eksport CSV gotowy.');
  }

  //---
  handleExportToPdfFile(showPrices: boolean) {
    const base = this.dataSource.filteredData.slice();
    const rows: any[] = this.dataSource.sort
      ? this.dataSource.sortData(base, this.dataSource.sort)
      : base;

    if (!rows.length) {
      this.snackbar.showWarning('Brak danych do eksportu.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;

    // Polish diacritics
    doc.setFont('Roboto-Regular', 'normal');

    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // vector ✓
    const drawTick = (cell: any, scale = 0.22) => {
      const { x, y, width, height } = cell;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const s = Math.min(width, height) * scale;
      doc.setDrawColor(0);
      doc.setLineWidth(Math.max(0.2, s / 5));
      doc.line(cx - 0.6 * s, cy + 0.05 * s, cx - 0.1 * s, cy + 0.8 * s);
      doc.line(cx - 0.1 * s, cy + 0.8 * s, cx + 0.9 * s, cy - 0.8 * s);
    };

    const price = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : '—';
    };

    /** Renders a section table with a caption and repeated caption on continuation pages */
    const renderSection = (
      caption: string,
      head: string[][],
      body: any[][],
      columnStyles: any,
      startY: number,
      checkCols?: Set<number>
    ): number => {
      // first-page caption
      doc.setFont('Roboto-Bold', 'normal');
      doc.setFontSize(11);
      doc.text(caption, marginX, startY);
      const tableStartY = startY + 4;

      const printedOnPage = new Set<number>();

      autoTable(doc, {
        startY: tableStartY,
        // leave header space (for repeated caption) and footer space (for page numbers)
        margin: { left: marginX, right: marginX, top: 24, bottom: 14 },
        head,
        body,
        styles: { font: 'Roboto-Regular', fontSize: 10, cellPadding: 2 },
        headStyles: {
          font: 'Roboto-Bold',
          fontStyle: 'normal',
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255]
        },
        columnStyles,

        didParseCell: (d) => {
          if (checkCols && d.section === 'body' && checkCols.has(d.column.index)) {
            d.cell.text = []; // hide "true/false"
          }
        },
        didDrawCell: (d) => {
          if (checkCols && d.section === 'body' && checkCols.has(d.column.index) && d.cell.raw === true) {
            drawTick(d.cell, 0.22);
          }
        },

        // repeat caption on this table's continuation pages only
        didDrawPage: (data) => {
          const tbl = (data as any).table;
          const start = tbl?.startPageNumber ?? data.pageNumber;
          const count = tbl?.pageCount ?? 1;
          const end = start + count - 1;

          if (data.pageNumber > start && data.pageNumber <= end && !printedOnPage.has(data.pageNumber)) {
            doc.setFont('Roboto-Bold', 'normal');
            doc.setFontSize(11);
            const yCap = data.settings.margin.top - 6;
            doc.text(caption, data.settings.margin.left, yCap);
            printedOnPage.add(data.pageNumber);
          }
        },
      });

      return (doc as any).lastAutoTable.finalY + 6;
    };

    const includePrices = !!showPrices;

    // helper: placeholder row with N columns
    const blankRow = (cols: number) => Array.from({ length: cols }, (_, i) => i === 0 ? 'Brak pozycji' : '');

    rows.forEach((row, idx) => {
      if (idx > 0) doc.addPage();

      // header
      let y = 10;
      doc.setFont('Roboto-Regular', 'normal');
      doc.setFontSize(10);
      doc.text(this.title || '—', marginX, y);
      doc.text(`Data: ${dateStr}`, pageWidth - marginX, y, { align: 'right' });
      y += 8;

      // centered club/registration name
      doc.setFontSize(14);
      doc.text(row.clubName ?? '—', pageWidth / 2, y, { align: 'center' });
      y += 6;

      // summary line (omit total price when includePrices === false)
      doc.setFontSize(10);
      const summaryParts: string[] = [
        `Adres: ${this.formatAddress(row) || '—'}`,
        `NIP: ${row.nip ?? '—'}`,
        `Osoba rejestrująca: ${row.registratorName ?? '—'}`
      ];
      if (includePrices) {
        summaryParts.push(`Cena całkowita [PLN]: ${price(row.totalPrice)}`);
      }
      const summary = summaryParts.join('    ');
      const wrapped = doc.splitTextToSize(summary, pageWidth - marginX * 2);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 5.5 + 5;

      // ---- Trenerzy ----
      {
        const headBase = [
          'Imię', 'Nazwisko', 'Pokój',
          'Kolacja Pt', 'Noc Pt/Sb', 'Obiad Sb', 'Kolacja Sb', 'Noc Sb/Nd', 'Obiad Nd'
        ];
        const head = [includePrices ? [...headBase, 'Cena [PLN]'] : headBase];

        const coaches = Array.isArray(row.coaches) ? row.coaches : [];
        const body = coaches.length
          ? coaches.map((c: any) => {
            const baseRow = [
              c?.personSpec?.firstname ?? '',
              c?.personSpec?.lastname ?? '',
              this.getRoom(row, c?.personSpec?.gender ?? ''),
              !!c?.personSpec?.supperFri,
              !!c?.personSpec?.nightFriSat,
              !!c?.dinnerSat,
              !!c?.personSpec?.supperSat,
              !!c?.personSpec?.nightSatSun,
              !!c?.personSpec?.dinnerSun,
            ];
            return includePrices ? [...baseRow, price(c?.personSpec?.price)] : baseRow;
          })
          : [blankRow(head[0].length)];

        const CHECK = new Set([3, 4, 5, 6, 7, 8]); // unchanged indices (price is after)
        const colStyles: any = {
          0: { cellWidth: 24 },
          1: { cellWidth: 30 },
          2: { cellWidth: 26 },
          3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' },
          6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
        };
        if (includePrices) {
          colStyles[9] = { halign: 'right', cellWidth: 22 };
        }

        y = renderSection('Trenerzy', head, body, colStyles, y, CHECK);
      }

      // ---- Zawodnicy ----
      {
        const headBase = [
          'Imię', 'Nazwisko', 'Rok ur.', 'Płeć', 'Kategoria', 'Liczba gier',
          'Kolacja Pt', 'Noc Pt/Sb', 'Obiad Sb', 'Kolacja Sb', 'Noc Sb/Nd', 'Obiad Nd'
        ];
        const head = [includePrices ? [...headBase, 'Cena [PLN]'] : headBase];

        const players = Array.isArray(row.players) ? row.players : [];
        const body = players.length
          ? players.map((p: any) => {
            const baseRow = [
              p?.personSpec?.firstname ?? '',
              p?.personSpec?.lastname ?? '',
              p?.birthYear ?? '',
              this.getGender(p?.personSpec?.gender ?? ''),
              p?.category ?? '',
              p?.games ?? '',
              !!p?.personSpec?.supperFri,
              !!p?.personSpec?.nightFriSat,
              this.hasDinnerSat(p),
              !!p?.personSpec?.supperSat,
              !!p?.personSpec?.nightSatSun,
              !!p?.personSpec?.dinnerSun,
            ];
            return includePrices ? [...baseRow, price(p?.personSpec?.price)] : baseRow;
          })
          : [blankRow(head[0].length)];

        const CHECK = new Set([6, 7, 8, 9, 10, 11]);
        const colStyles: any = {
          0: { cellWidth: 24 },
          1: { cellWidth: 30 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 22 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
          9: { halign: 'center' }, 10: { halign: 'center' }, 11: { halign: 'center' },
        };
        if (includePrices) {
          colStyles[12] = { halign: 'right', cellWidth: 22 };
        }

        y = renderSection('Zawodnicy', head, body, colStyles, y, CHECK);
      }

      // ---- Status ---- (unchanged)
      {
        const head = [['Data i czas', 'Status', 'Uwagi']];

        const statuses = Array.isArray(row.statuses) ? row.statuses : [];
        const body = statuses.length
          ? statuses.map((s: any) => {
            const dt = this.toDateFromArray(s?.datetime);
            const when = dt
              ? new Intl.DateTimeFormat('pl-PL', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              }).format(dt)
              : '—';
            return [when, this.getStatus(s?.status ?? ''), s?.comment ?? ''];
          })
          : [['Brak pozycji', '—', '']];

        y = renderSection('Status', head, body, { 0: { cellWidth: 48 }, 1: { cellWidth: 35 } }, y);
      }
    });

    // ----- Page numbers (footer) -----
    {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const w = doc.internal.pageSize.getWidth();
        const h = doc.internal.pageSize.getHeight();
        doc.setFont('Roboto-Regular', 'normal');
        doc.setFontSize(9);
        doc.text(`Strona ${i} / ${pageCount}`, w - marginX, h - 6, { align: 'right' });
      }
    }

    const fn = `rejestracje_szczegoly_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
    doc.save(fn);
    this.snackbar.showSuccess('PDF wygenerowany.');
  }

  //===
  x_handleExportToPdfFile(showPrices: boolean) {
    const base = this.dataSource.filteredData.slice();
    const rows: any[] = this.dataSource.sort
      ? this.dataSource.sortData(base, this.dataSource.sort)
      : base;

    if (!rows.length) {
      this.snackbar.showWarning('Brak danych do eksportu.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;

    // Polish diacritics
    doc.setFont('Roboto-Regular', 'normal');

    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // vector ✓ (no glyph dependency)
    const drawTick = (cell: any, scale = 0.22) => {
      const { x, y, width, height } = cell;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const s = Math.min(width, height) * scale;
      doc.setDrawColor(0);
      doc.setLineWidth(Math.max(0.2, s / 5));
      doc.line(cx - 0.6 * s, cy + 0.05 * s, cx - 0.1 * s, cy + 0.8 * s);
      doc.line(cx - 0.1 * s, cy + 0.8 * s, cx + 0.9 * s, cy - 0.8 * s);
    };

    const price = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : '—';
    };

    /** Renders a section table with a caption and repeated caption on continuation pages */
    const renderSection = (
      caption: string,
      head: string[][],
      body: any[][],
      columnStyles: any,
      startY: number,
      checkCols?: Set<number>
    ): number => {
      // first-page caption
      doc.setFont('Roboto-Bold', 'normal');
      doc.setFontSize(11);
      doc.text(caption, marginX, startY);
      const tableStartY = startY + 4;

      const printedOnPage = new Set<number>();

      autoTable(doc, {
        startY: tableStartY,
        // leave header space (for repeated caption) and footer space (for page numbers)
        margin: { left: marginX, right: marginX, top: 24, bottom: 14 },
        head,
        body,
        styles: { font: 'Roboto-Regular', fontSize: 10, cellPadding: 2 },
        headStyles: {
          font: 'Roboto-Bold',
          fontStyle: 'normal',
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255]
        },
        columnStyles,

        didParseCell: (d) => {
          if (checkCols && d.section === 'body' && checkCols.has(d.column.index)) {
            d.cell.text = []; // hide "true/false"
          }
        },
        didDrawCell: (d) => {
          if (checkCols && d.section === 'body' && checkCols.has(d.column.index) && d.cell.raw === true) {
            drawTick(d.cell, 0.22);
          }
        },

        // repeat caption on this table's continuation pages only
        didDrawPage: (data) => {
          const tbl = (data as any).table;
          const start = tbl?.startPageNumber ?? data.pageNumber;
          const count = tbl?.pageCount ?? 1;
          const end = start + count - 1;

          if (data.pageNumber > start && data.pageNumber <= end && !printedOnPage.has(data.pageNumber)) {
            doc.setFont('Roboto-Bold', 'normal');
            doc.setFontSize(11);
            const yCap = data.settings.margin.top - 6;
            doc.text(caption, data.settings.margin.left, yCap);
            printedOnPage.add(data.pageNumber);
          }
        },
      });

      return (doc as any).lastAutoTable.finalY + 6;
    };

    rows.forEach((row, idx) => {
      if (idx > 0) doc.addPage();

      // header
      let y = 10;
      doc.setFont('Roboto-Regular', 'normal');
      doc.setFontSize(10);
      doc.text(this.title || '—', marginX, y);
      doc.text(`Data: ${dateStr}`, pageWidth - marginX, y, { align: 'right' });
      y += 8;

      // centered club/registration name
      doc.setFontSize(14);
      doc.text(row.clubName ?? '—', pageWidth / 2, y, { align: 'center' });
      y += 6;

      // summary line
      doc.setFontSize(10);
      const summary = [
        `Adres: ${this.formatAddress(row) || '—'}`,
        `NIP: ${row.nip ?? '—'}`,
        `Osoba rejestrująca: ${row.registratorName ?? '—'}`,
        `Cena całkowita [PLN]: ${price(row.totalPrice)}`
      ].join('    ');
      const wrapped = doc.splitTextToSize(summary, pageWidth - marginX * 2);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 5.5 + 5;

      // ---- Trenerzy ----
      {
        const head = [[
          'Imię', 'Nazwisko', 'Pokój',
          'Kolacja Pt', 'Noc Pt/Sb', 'Obiad Sb', 'Kolacja Sb', 'Noc Sb/Nd', 'Obiad Nd',
          'Cena [PLN]'
        ]];

        const coaches = Array.isArray(row.coaches) ? row.coaches : [];
        const body = coaches.length
          ? coaches.map((c: any) => ([
            c?.personSpec?.firstname ?? '',
            c?.personSpec?.lastname ?? '',
            this.getRoom(row, c?.personSpec?.gender ?? ''),
            !!c?.personSpec?.supperFri,
            !!c?.personSpec?.nightFriSat,
            !!c?.dinnerSat,
            !!c?.personSpec?.supperSat,
            !!c?.personSpec?.nightSatSun,
            !!c?.personSpec?.dinnerSun,
            price(c?.personSpec?.price),
          ]))
          : [['Brak pozycji', '', '', '', '', '', '', '', '', '']];

        const CHECK = new Set([3, 4, 5, 6, 7, 8]);
        y = renderSection(
          'Trenerzy',
          head,
          body,
          {
            0: { cellWidth: 24 },
            1: { cellWidth: 30 },
            2: { cellWidth: 26 },
            3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' },
            6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
            9: { halign: 'right', cellWidth: 22 },
          },
          y,
          CHECK
        );
      }

      // ---- Zawodnicy ----
      {
        const head = [[
          'Imię', 'Nazwisko', 'Rok ur.', 'Płeć', 'Kategoria', 'Liczba gier',
          'Kolacja Pt', 'Noc Pt/Sb', 'Obiad Sb', 'Kolacja Sb', 'Noc Sb/Nd', 'Obiad Nd',
          'Cena [PLN]'
        ]];

        const players = Array.isArray(row.players) ? row.players : [];
        const body = players.length
          ? players.map((p: any) => ([
            p?.personSpec?.firstname ?? '',
            p?.personSpec?.lastname ?? '',
            p?.birthYear ?? '',
            this.getGender(p?.personSpec?.gender ?? ''),
            p?.category ?? '',
            p?.games ?? '',
            !!p?.personSpec?.supperFri,
            !!p?.personSpec?.nightFriSat,
            this.hasDinnerSat(p),
            !!p?.personSpec?.supperSat,
            !!p?.personSpec?.nightSatSun,
            !!p?.personSpec?.dinnerSun,
            price(p?.personSpec?.price),
          ]))
          : [['Brak pozycji', '', '', '', '', '', '', '', '', '', '', '', '']];

        const CHECK = new Set([6, 7, 8, 9, 10, 11]);
        y = renderSection(
          'Zawodnicy',
          head,
          body,
          {
            0: { cellWidth: 24 },
            1: { cellWidth: 30 },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 22 },
            5: { halign: 'right', cellWidth: 22 },
            6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
            9: { halign: 'center' }, 10: { halign: 'center' }, 11: { halign: 'center' },
            12: { halign: 'right', cellWidth: 22 },
          },
          y,
          CHECK
        );
      }

      // ---- Status ----
      {
        const head = [['Data i czas', 'Status', 'Uwagi']];

        const statuses = Array.isArray(row.statuses) ? row.statuses : [];
        const body = statuses.length
          ? statuses.map((s: any) => {
            const dt = this.toDateFromArray(s?.datetime);
            const when = dt
              ? new Intl.DateTimeFormat('pl-PL', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              }).format(dt)
              : '—';
            return [when, this.getStatus(s?.status ?? ''), s?.comment ?? ''];
          })
          : [['Brak pozycji', '—', '']];

        y = renderSection(
          'Status',
          head,
          body,
          { 0: { cellWidth: 48 }, 1: { cellWidth: 35 } },
          y
        );
      }
    });

    // ----- Page numbers (footer) -----
    {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const w = doc.internal.pageSize.getWidth();
        const h = doc.internal.pageSize.getHeight();
        doc.setFont('Roboto-Regular', 'normal');
        doc.setFontSize(9);
        doc.text(`Strona ${i} / ${pageCount}`, w - marginX, h - 6, { align: 'right' });
      }
    }

    const fn = `rejestracje_szczegoly_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
    doc.save(fn);
    this.snackbar.showSuccess('PDF wygenerowany.');
  }



  // handleExportToPdfFile() {
  //   const base = this.dataSource.filteredData.slice();
  //   const rows: any[] = this.dataSource.sort
  //     ? this.dataSource.sortData(base, this.dataSource.sort)
  //     : base;

  //   if (!rows.length) {
  //     this.snackbar.showWarning('Brak danych do eksportu.');
  //     return;
  //   }

  //   const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   const marginX = 10;

  //   // use Roboto everywhere (diacritics)
  //   doc.setFont('Roboto-Regular', 'normal');

  //   const pad = (n: number) => n.toString().padStart(2, '0');
  //   const now = new Date();
  //   const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  //   // tick as vector, so no dependency on font glyphs
  //   const drawTick = (cell: any, scale = 0.22) => {
  //     const { x, y, width, height } = cell;
  //     const cx = x + width / 2;
  //     const cy = y + height / 2;
  //     const s = Math.min(width, height) * scale;
  //     doc.setDrawColor(0);
  //     doc.setLineWidth(Math.max(0.2, s / 5));
  //     doc.line(cx - 0.6 * s, cy + 0.05 * s, cx - 0.1 * s, cy + 0.8 * s);
  //     doc.line(cx - 0.1 * s, cy + 0.8 * s, cx + 0.9 * s, cy - 0.8 * s);
  //   };

  //   const price = (v: any) => {
  //     const n = Number(v);
  //     return Number.isFinite(n) ? n.toFixed(2) : '—';
  //   };

  //   /**
  //    * Render a section table with a caption. The caption is shown:
  //    *  - directly above the table on its first page
  //    *  - at the top of continuation pages that belong to THIS table only
  //    */
  //   const renderSection = (
  //     caption: string,
  //     head: string[][],
  //     body: any[][],
  //     columnStyles: any,
  //     startY: number,
  //     checkCols?: Set<number>       // columns with boolean ticks
  //   ): number => {
  //     // first page caption
  //     doc.setFont('Roboto-Bold', 'normal');
  //     doc.setFontSize(11);
  //     doc.text(caption, marginX, startY);
  //     const tableStartY = startY + 4;

  //     // remember where this table starts; also track which pages we already wrote the caption on
  //     const printedOnPage = new Set<number>();

  //     autoTable(doc, {
  //       startY: tableStartY,
  //       margin: { left: marginX, right: marginX, top: 24 }, // room for repeated caption on continuation pages
  //       head,
  //       body,
  //       styles: { font: 'Roboto-Regular', fontSize: 10, cellPadding: 2 },
  //       headStyles: {
  //         font: 'Roboto-Bold',
  //         fontStyle: 'normal',
  //         fillColor: [41, 128, 185],
  //         textColor: [255, 255, 255]
  //       },
  //       columnStyles,

  //       // hide raw boolean text and draw a tick instead
  //       didParseCell: (d) => {
  //         if (checkCols && d.section === 'body' && checkCols.has(d.column.index)) {
  //           d.cell.text = []; // suppress "true/false"
  //         }
  //       },
  //       didDrawCell: (d) => {
  //         if (checkCols && d.section === 'body' && checkCols.has(d.column.index) && d.cell.raw === true) {
  //           drawTick(d.cell, 0.22);
  //         }
  //       },

  //       // repeat caption only on pages that belong to THIS table (not others)
  //       didDrawPage: (data) => {
  //         const tbl = (data as any).table;
  //         const start = tbl?.startPageNumber ?? data.pageNumber;
  //         const count = tbl?.pageCount ?? 1;
  //         const end = start + count - 1;

  //         if (data.pageNumber > start && data.pageNumber <= end && !printedOnPage.has(data.pageNumber)) {
  //           doc.setFont('Roboto-Bold', 'normal');
  //           doc.setFontSize(11);
  //           const yCap = data.settings.margin.top - 6; // just above the table header
  //           doc.text(caption, data.settings.margin.left, yCap);
  //           printedOnPage.add(data.pageNumber);
  //         }
  //       },
  //     });

  //     return (doc as any).lastAutoTable.finalY + 6;
  //   };

  //   rows.forEach((row, idx) => {
  //     if (idx > 0) doc.addPage();

  //     // ---- page header ----
  //     let y = 10;
  //     doc.setFont('Roboto-Regular', 'normal');
  //     doc.setFontSize(10);
  //     doc.text(this.title || '—', marginX, y);
  //     doc.text(`Data: ${dateStr}`, pageWidth - marginX, y, { align: 'right' });
  //     y += 8;

  //     // centered club name
  //     doc.setFontSize(14);
  //     doc.text(row.clubName ?? '—', pageWidth / 2, y, { align: 'center' });
  //     y += 6;

  //     // summary line
  //     doc.setFontSize(10);
  //     const summary = [
  //       `Adres: ${this.formatAddress(row) || '—'}`,
  //       `NIP: ${row.nip ?? '—'}`,
  //       `Osoba rejestrująca: ${row.registratorName ?? '—'}`,
  //       `Cena całkowita [PLN]: ${price(row.totalPrice)}`
  //     ].join('    ');
  //     const wrapped = doc.splitTextToSize(summary, pageWidth - marginX * 2);
  //     doc.text(wrapped, marginX, y);
  //     y += wrapped.length * 5.5 + 5;

  //     // -------- Trenerzy --------
  //     {
  //       const head = [[
  //         'Imię', 'Nazwisko', 'Pokój',
  //         'Kolacja Pt', 'Noc Pt/Sb', 'Obiad Sb', 'Kolacja Sb', 'Noc Sb/Nd', 'Obiad Nd',
  //         'Cena [PLN]'
  //       ]];

  //       const coaches = Array.isArray(row.coaches) ? row.coaches : [];
  //       const body = coaches.length
  //         ? coaches.map((c: any) => ([
  //           c?.personSpec?.firstname ?? '',
  //           c?.personSpec?.lastname ?? '',
  //           this.getRoom(c?.personSpec?.gender ?? ''),
  //           !!c?.personSpec?.supperFri,
  //           !!c?.personSpec?.nightFriSat,
  //           !!c?.dinnerSat,
  //           !!c?.personSpec?.supperSat,
  //           !!c?.personSpec?.nightSatSun,
  //           !!c?.personSpec?.dinnerSun,
  //           price(c?.personSpec?.price),
  //         ]))
  //         : [['Brak pozycji', '', '', '', '', '', '', '', '', '']];

  //       const CHECK = new Set([3, 4, 5, 6, 7, 8]); // boolean columns
  //       y = renderSection(
  //         'Trenerzy',
  //         head,
  //         body,
  //         {
  //           0: { cellWidth: 24 },
  //           1: { cellWidth: 30 },
  //           2: { cellWidth: 26 },
  //           3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' },
  //           6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
  //           9: { halign: 'right', cellWidth: 22 },
  //         },
  //         y,
  //         CHECK
  //       );
  //     }

  //     // -------- Zawodnicy --------
  //     {
  //       const head = [[
  //         'Imię', 'Nazwisko', 'Rok ur.', 'Płeć', 'Kategoria', 'Liczba gier',
  //         'Kolacja Pt', 'Noc Pt/Sb', 'Kolacja Sb', 'Noc Sb/Nd', 'Obiad Nd',
  //         'Cena [PLN]'
  //       ]];

  //       const players = Array.isArray(row.players) ? row.players : [];
  //       const body = players.length
  //         ? players.map((p: any) => ([
  //           p?.personSpec?.firstname ?? '',
  //           p?.personSpec?.lastname ?? '',
  //           p?.birthYear ?? '',
  //           this.getGender(p?.personSpec?.gender ?? ''),
  //           p?.category ?? '',
  //           p?.games ?? '',
  //           !!p?.personSpec?.supperFri,
  //           !!p?.personSpec?.nightFriSat,
  //           !!p?.personSpec?.supperSat,
  //           !!p?.personSpec?.nightSatSun,
  //           !!p?.personSpec?.dinnerSun,
  //           price(p?.personSpec?.price),
  //         ]))
  //         : [['Brak pozycji', '', '', '', '', '', '', '', '', '', '', '']];

  //       const CHECK = new Set([6, 7, 8, 9, 10]); // boolean columns
  //       y = renderSection(
  //         'Zawodnicy',
  //         head,
  //         body,
  //         {
  //           0: { cellWidth: 24 },
  //           1: { cellWidth: 30 },
  //           2: { halign: 'center', cellWidth: 18 },
  //           3: { halign: 'center', cellWidth: 22 },
  //           5: { halign: 'right', cellWidth: 22 },
  //           6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' },
  //           9: { halign: 'center' }, 10: { halign: 'center' },
  //           11: { halign: 'right', cellWidth: 22 },
  //         },
  //         y,
  //         CHECK
  //       );
  //     }

  //     // -------- Status --------
  //     {
  //       const head = [['Data i czas', 'Status', 'Uwagi']];

  //       const statuses = Array.isArray(row.statuses) ? row.statuses : [];
  //       const body = statuses.length
  //         ? statuses.map((s: any) => {
  //           const dt = this.toDateFromArray(s?.datetime);
  //           const when = dt
  //             ? new Intl.DateTimeFormat('pl-PL', {
  //               year: 'numeric', month: '2-digit', day: '2-digit',
  //               hour: '2-digit', minute: '2-digit', second: '2-digit'
  //             }).format(dt)
  //             : '—';
  //           return [when, this.getStatus(s?.status ?? ''), s?.comment ?? ''];
  //         })
  //         : [['Brak pozycji', '—', '']];

  //       y = renderSection(
  //         'Status',
  //         head,
  //         body,
  //         { 0: { cellWidth: 48 }, 1: { cellWidth: 35 } },
  //         y
  //       );
  //     }
  //   });

  //   const fn = `rejestracje_szczegoly_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
  //   doc.save(fn);
  //   this.snackbar.showSuccess('PDF wygenerowany.');
  // }


}