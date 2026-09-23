import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { RegistrationService } from '../../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';
import { HttpErrorResponse } from '@angular/common/http';
import { ListHeader } from "../../../../shared/list-header/list-header";
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import jsPDF from 'jspdf';
import autoTable, { CellDef, RowInput } from 'jspdf-autotable';
import '../../../../../../public/fonts/Roboto-Regular-normal.js';
import '../../../../../../public/fonts/Roboto-Bold-normal.js';
import '../../../../../../public/fonts/Roboto-Italic-normal.js';
import { GeneralSettingsService } from '../../../../_services/general-settings/general-settings-service';
import { finalize, forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { InputDialog } from '../../../../shared/dialogs/input-dialog/input-dialog';


@Component({
  selector: 'app-all-list',
  imports: [CommonModule, ListHeader, MatTableModule, MatProgressSpinnerModule, MatIconModule, MatSortModule],
  templateUrl: './all-list.html',
  styleUrl: './all-list.scss'
})
export class AllList implements OnInit {

  @ViewChild(MatSort) sort!: MatSort;

  title: string = 'Wszyscy uczestnicy';
  service = inject(RegistrationService)
  loading = false;
  private snackbar = inject(SnackbarService);
  displayedColumns: string[] = ['rowNumber', 'clubName', 'lastname', 'firstname', 'gender', 'birthYear', 'category', 'games', 'supper_fri', 'night_fri_sat', 'dinner_sat', 'supper_sat', 'night_sat_sun', 'dinner_sun', 'price_pln'];
  private generalSettingsService = inject(GeneralSettingsService);
  private dialog = inject(MatDialog);

  pdfTitle = '';          // title shown in the PDF header

  dataSource = new MatTableDataSource<any>([]);

  ngAfterViewInit() {
    //sorting
    this.dataSource.sortingDataAccessor = (row: any, column: string) => {
      switch (column) {
        case 'clubName': return row.clubName ?? '';
        case 'lastname': return row.playerSpec?.personSpec?.lastname ?? '';
        case 'firstname': return row.playerSpec?.personSpec?.firstname ?? '';
        case 'gender': return this.getRoom(row, row.playerSpec?.personSpec?.gender ?? '').toLowerCase();
        case 'birthYear': return Number(row.playerSpec?.birthYear) || 0;
        case 'category': return row.playerSpec?.category ?? '';
        case 'games': return Number(row.playerSpec?.games) || 0;
        case 'supper_fri': return row.playerSpec?.personSpec?.supperFri ? 1 : 0;
        case 'night_fri_sat': return row.playerSpec?.personSpec?.nightFriSat ? 1 : 0;
        case 'dinner_sat': return (row.playerSpec?.personSpec?.dinnerSat ?? row.dinnerSat) ? 1 : 0;
        case 'supper_sat': return row.playerSpec?.personSpec?.supperSat ? 1 : 0;
        case 'night_sat_sun': return row.playerSpec?.personSpec?.nightSatSun ? 1 : 0;
        case 'dinner_sun': return row.playerSpec?.personSpec?.dinnerSun ? 1 : 0;
        case 'price_pln': return Number(row.playerSpec?.personSpec?.price) || 0;
        default: return '';
      }
    };
    this.dataSource.sort = this.sort;

    // filtering
    this.dataSource.filterPredicate = (row: any, filter: string) => {
      const t = (v: any) => (v ?? '').toString().toLowerCase();

      const p = row.playerSpec?.personSpec ?? {};
      const flat = [
        row.clubName,
        p.lastname, p.firstname,
        this.getRoom(row, p.gender),            // pokój as text
        row.playerSpec?.birthYear,
        row.playerSpec?.category,
        row.playerSpec?.games,
        p.supperFri ? '✓ tak true' : 'nie',     // let user type ✓ or “tak”
        p.nightFriSat ? '✓ tak true' : 'nie',
        (p.dinnerSat ?? row.dinnerSat) ? '✓ tak true' : 'nie',
        p.supperSat ? '✓ tak true' : 'nie',
        p.nightSatSun ? '✓ tak true' : 'nie',
        p.dinnerSun ? '✓ tak true' : 'nie',
        p.price
      ].map(t).join(' ');

      return flat.includes(filter.trim().toLowerCase());
    }
  }

  ngOnInit(): void {
    // 1) Title – independent
    this.generalSettingsService.findByKey1('title').subscribe({
      next: (res: any) => this.pdfTitle = res?.data ?? res?.value1 ?? '',
      error: () => (this.pdfTitle = ''),
    });

    // 2) Rows – independent, with spinner
    this.loading = true;
    this.service.readAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (resp: any) => {
          // same coercion you had before
          const rows =
            Array.isArray(resp) ? resp :
              Array.isArray(resp?.data) ? resp.data :
                Array.isArray(resp?.items) ? resp.items : [];

          this.dataSource.data = rows;          // keep same instance
          if (this.sort) this.dataSource.sort = this.sort;
        },
        error: (err: HttpErrorResponse) => {
          const msg = err?.error?.message ?? 'Unknown error';
          this.snackbar.showError('Błąd w pobieraniu listy uczestników. ' + msg);
        }
        // no complete needed; finalize handles spinner
      });
  }

  // ngOnInit(): void {
  //   // title – independent request, no spinner
  //   this.generalSettingsService.findByKey1('title').subscribe({
  //     next: (res: any) => this.pdfTitle = res?.data ?? res?.value1 ?? '',
  //     error: () => (this.pdfTitle = ''),
  //   });

  //   // existing code that loads table rows ...
  //   this.loading = true;
  //   this.service.readAll()
  //     .pipe(finalize(() => this.loading = false))
  //     .subscribe({ /* your existing next/error/complete */ });
  // }

  // ngOnInit(): void {
  //   this.loading = true;
  //   this.service.readAll().subscribe({
  //     next: (resp: any) => {
  //       console.log('ngOnInit resp:', resp);

  //       // Coerce to array from common shapes: [], {data: []}, {items: []}
  //       const rows =
  //         Array.isArray(resp) ? resp :
  //           Array.isArray(resp?.data) ? resp.data :
  //             Array.isArray(resp?.items) ? resp.items :
  //               [];

  //       this.dataSource.data = rows;                // <- keep same instance
  //       if (this.sort) this.dataSource.sort = this.sort;
  //     },
  //     error: (err: HttpErrorResponse) => {
  //       this.loading = false;
  //       const msg = (err.error && err.error.message) ? err.error.message : 'Unknown error';
  //       this.snackbar.showError('Błąd w pobieraniu listy uczestników. ' + msg);
  //     },
  //     complete: () => {
  //       this.loading = false;
  //     },
  //   });
  // }


  handleDataSourceChanged(updatedDataSource: MatTableDataSource<any>): void {
    // this.dataSource = updatedDataSource;
  }

  handleLoadingChanged(loading: boolean): void {
    this.loading = loading;
    //this.cdr.detectChanges();
  }

  // rowNumber(row: any): number {
  //   // Start from filtered data (what mat-table uses)
  //   const base = this.dataSource.filteredData.slice();

  //   // Apply current sort (so numbering matches UI order)
  //   const ordered = this.dataSource.sort
  //     ? this.dataSource.sortData(base, this.dataSource.sort)
  //     : base;

  //   const idx = ordered.indexOf(row);
  //   if (idx === -1) return 0;

  //   // Reverse numbering: last row -> 1
  //   return ordered.length - idx;
  // }

  getRoom(row: any, gender: string): string {
    const registrationType = (
      row?.registrationType
      ?? row?.registration_type
      ?? row?.playerSpec?.registrationType
      ?? row?.playerSpec?.registration_type
      ?? ''
    ).toString().toUpperCase();

    // The /register/all response currently does not always expose registrationType.
    // In family registrations the room is shared and gender is therefore empty.
    if (registrationType === 'FAMILY' || !gender) {
      return 'rodzinny';
    }

    switch (gender) {
      case 'm': return 'męski';
      case 'f': return 'damski';
      case 's': return 'jednoosobowy';
      default: return '—';
    }
  }

  get rows(): any[] { return this.dataSource?.filteredData ?? []; }

  get totalGames(): number {
    return this.rows.reduce((s, r) => s + (Number(r.playerSpec?.games) || 0), 0);
  }

  get cntSupperFri(): number { return this.rows.filter(r => !!r.playerSpec?.personSpec?.supperFri).length; }
  get cntNightFriSat(): number { return this.rows.filter(r => !!r.playerSpec?.personSpec?.nightFriSat).length; }
  get cntDinnerSat(): number {
    return this.rows.filter(r => (r.playerSpec?.personSpec?.dinnerSat ?? r?.dinnerSat) === true).length;
  }
  get cntSupperSat(): number { return this.rows.filter(r => !!r.playerSpec?.personSpec?.supperSat).length; }
  get cntNightSatSun(): number { return this.rows.filter(r => !!r.playerSpec?.personSpec?.nightSatSun).length; }
  get cntDinnerSun(): number { return this.rows.filter(r => !!r.playerSpec?.personSpec?.dinnerSun).length; }

  get totalPrice(): number {
    return this.rows.reduce((s, r) => s + (Number(r.playerSpec?.personSpec?.price) || 0), 0);
  }

  handleCouponRequest(type: string): void {
    const config = this.getCouponConfig(type);
    if (!config) {
      this.snackbar.showError('Nieznany rodzaj kuponu.');
      return;
    }

    const dialogRef = this.dialog.open(InputDialog, {
      width: '420px',
      data: {
        title: 'Ile wydrukować kuponów?',
        defaultValue: String(config.defaultCount),
        inputType: 'number'
      }
    });

    dialogRef.afterClosed().subscribe((value: string | number | undefined) => {
      if (value === undefined || value === null || value === '') return;

      const count = Number(value);
      if (!Number.isInteger(count) || count <= 0 || count > 1000) {
        this.snackbar.showWarning('Podaj liczbę całkowitą od 1 do 1000.');
        return;
      }

      forkJoin({
        title: this.generalSettingsService.findByKey1('coupon_title'),
        date: this.generalSettingsService.findByKey1(config.dateSettingKey)
      }).subscribe({
        next: settings => {
          const couponTitle = this.settingValue(settings.title);
          const couponDate = this.settingValue(settings.date);

          if (!couponTitle || !couponDate) {
            this.snackbar.showWarning('Uzupełnij tytuł i daty kuponów w Ustawieniach.');
            return;
          }

          this.generateCouponsPdf(count, couponTitle, config.meal, config.day, couponDate);
        },
        error: () => this.snackbar.showError('Nie udało się pobrać ustawień kuponów.')
      });
    });
  }

  private getCouponConfig(type: string): { defaultCount: number; meal: string; day: string; dateSettingKey: string } | null {
    switch (type) {
      case 'SUPPER_FRIDAY':
        return { defaultCount: this.cntSupperFri, meal: 'KOLACJA', day: 'PIĄTEK', dateSettingKey: 'coupon_date_friday' };
      case 'DINNER_SATURDAY':
        return { defaultCount: this.cntDinnerSat, meal: 'OBIAD', day: 'SOBOTA', dateSettingKey: 'coupon_date_saturday' };
      case 'SUPPER_SATURDAY':
        return { defaultCount: this.cntSupperSat, meal: 'KOLACJA', day: 'SOBOTA', dateSettingKey: 'coupon_date_saturday' };
      case 'DINNER_SUNDAY':
        return { defaultCount: this.cntDinnerSun, meal: 'OBIAD', day: 'NIEDZIELA', dateSettingKey: 'coupon_date_sunday' };
      default:
        return null;
    }
  }

  private settingValue(response: any): string {
    const value = response?.data?.value1 ?? response?.data ?? response?.value1 ?? '';
    return String(value).trim();
  }

  private formatCouponDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
  }

  private generateCouponsPdf(count: number, couponTitle: string, meal: string, day: string, dateValue: string): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('Roboto-Regular', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 10;
    const marginY = 10;
    const columns = 5;
    const rows = 10;
    const couponsPerPage = columns * rows;
    const couponWidth = (pageWidth - 2 * marginX) / columns;
    const couponHeight = (pageHeight - 2 * marginY) / rows;
    const formattedDate = this.formatCouponDate(dateValue);

    for (let index = 0; index < count; index++) {
      if (index > 0 && index % couponsPerPage === 0) doc.addPage();

      const pageIndex = index % couponsPerPage;
      const column = pageIndex % columns;
      const row = Math.floor(pageIndex / columns);
      const x = marginX + column * couponWidth;
      const y = marginY + row * couponHeight;
      const centerX = x + couponWidth / 2;

      doc.setDrawColor(90);
      doc.setLineWidth(0.25);
      doc.rect(x, y, couponWidth, couponHeight);

      doc.setFont('Roboto-Bold', 'normal');
      doc.setFontSize(8.5);
      const titleLines = doc.splitTextToSize(couponTitle, couponWidth - 4).slice(0, 2);
      doc.text(titleLines, centerX, y + 5, { align: 'center' });

      const titleHeight = titleLines.length * 3.3;
      doc.setFontSize(12);
      doc.text(meal, centerX, y + 10 + titleHeight, { align: 'center' });
      doc.setFontSize(10.5);
      doc.text(day, centerX, y + 15 + titleHeight, { align: 'center' });

      doc.setFont('Roboto-Regular', 'normal');
      doc.setFontSize(8.5);
      doc.text(formattedDate, x + 2, y + couponHeight - 2.5);

      doc.setFont('Roboto-Bold', 'normal');
      doc.setFontSize(9);
      doc.text(String(index + 1), x + couponWidth - 2, y + couponHeight - 2.5, { align: 'right' });
    }

    const safeMeal = `${meal}_${day}`.toLowerCase().replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ż|ź/g, 'z');
    doc.save(`kupony_${safeMeal}_${dateValue}.pdf`);
  }

  handleExportToCsvFile() {
    const rows: any[] = this.dataSource.filteredData ?? [];
    if (!rows.length) {
      this.snackbar.showWarning('Brak danych do eksportu.');
      return;
    }

    // CSV helpers
    const SEP = ';';
    const esc = (v: any): string => {
      const s = (v ?? '').toString();
      return (s.includes('"') || s.includes('\n') || s.includes(SEP))
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const room = (r: any, g: string) => this.getRoom(r, g);
    const b = (v: any) => (v ? '1' : '0');                            // booleans as 1/0
    const price = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '';
    };

    // Header (keep in the same order as your table/PDF)
    const header = [
      '#', 'Klub', 'Nazwisko', 'Imię', 'Pokój', 'Rok ur.', 'Kategoria', 'Liczba gier',
      'Kolacja pt', 'Noc pt/sb', 'Obiad sb', 'Kolacja sb', 'Noc sb/nie', 'Obiad nie', 'Cena [PLN]'
    ];

    // Body
    const bodyLines = rows.map((r: any, i: number) => {
      const p = r.playerSpec?.personSpec ?? {};
      const cells = [
        i + 1,
        r.clubName ?? '',
        p.lastname ?? '',
        p.firstname ?? '',
        room(r, p.gender ?? ''),
        r.playerSpec?.birthYear ?? '',
        r.playerSpec?.category ?? '',
        r.playerSpec?.games ?? '',
        b(p.supperFri),
        b(p.nightFriSat),
        b(p.dinnerSat ?? r.dinnerSat),
        b(p.supperSat),
        b(p.nightSatSun),
        b(p.dinnerSun),
        price(p.price),
      ];
      return cells.map(esc).join(SEP);
    });

    // Totals (footer)
    const totalGames = rows.reduce((s, r) => s + (Number(r.playerSpec?.games) || 0), 0);
    const cntSupperFri = rows.filter(r => !!r.playerSpec?.personSpec?.supperFri).length;
    const cntNightFS = rows.filter(r => !!r.playerSpec?.personSpec?.nightFriSat).length;
    const cntDinnerSat = rows.filter(r => (r.playerSpec?.personSpec?.dinnerSat ?? r?.dinnerSat) === true).length;
    const cntSupperSat = rows.filter(r => !!r.playerSpec?.personSpec?.supperSat).length;
    const cntNightSS = rows.filter(r => !!r.playerSpec?.personSpec?.nightSatSun).length;
    const cntDinnerSun = rows.filter(r => !!r.playerSpec?.personSpec?.dinnerSun).length;
    const totalPrice = rows.reduce((s, r) => s + (Number(r.playerSpec?.personSpec?.price) || 0), 0);

    // Put 6 empties + "Razem" in col 7, then numbers to align with header
    const footerRow = [
      '', '', '', '', '', '', 'Razem',
      totalGames, cntSupperFri, cntNightFS, cntDinnerSat, cntSupperSat, cntNightSS, cntDinnerSun, price(totalPrice)
    ].map(esc).join(SEP);

    // Optional filter banner on top
    const filter = (this.dataSource.filter || '').trim();
    const topLines = filter
      ? [`Filtr: ${filter} — wyników: ${rows.length} / ${this.dataSource.data.length}`, '']
      : [];

    // Build CSV (with BOM for Excel/Polish diacritics)
    const csv = '\uFEFF' + [
      ...topLines,
      header.map(esc).join(SEP),
      ...bodyLines,
      footerRow
    ].join('\r\n');

    // Download
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const filename = `uczestnicy_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    this.snackbar.showSuccess('Eksport CSV gotowy.');
  }


  handleExportToPdfFile() {
    const rows = this.dataSource.filteredData;
    if (!rows.length) {
      this.snackbar.showWarning('Brak danych do eksportu.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('Roboto-Regular', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // header line: title (left) + date (right)
    doc.setFontSize(8);
    const topY = 10;
    doc.text(this.pdfTitle || '', 10, topY);
    doc.text(`Data: ${dateStr}`, pageWidth - 10, topY, { align: 'right' });

    // section title
    doc.setFontSize(12);
    doc.text('Wszyscy uczestnicy', pageWidth / 2, 18, { align: 'center' });

    // optional filter info
    let startY = 30;
    const activeFilter = (this.dataSource.filter || '').trim();
    if (activeFilter) {
      doc.setFontSize(10);
      const info = `Filtr: ${activeFilter} — wyników: ${rows.length} / ${this.dataSource.data.length}`;
      const wrapped = doc.splitTextToSize(info, pageWidth - 20);
      const y = 24;
      doc.text(wrapped, 10, y);
      const lineHeight = 6;
      startY = y + wrapped.length * lineHeight + 4;
    }

    // helpers
    const mark = (v: any) => Boolean(v); // keep raw boolean, we’ll draw a tick in hooks
    const room = (r: any, g: string) => this.getRoom(r, g);
    const price = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : '';
    };

    // head
    const head = [[
      '#', 'Klub', 'Nazwisko', 'Imię', 'Pokój', 'Rok ur.', 'Kategoria', 'Liczba gier',
      'Kolacja pt', 'Noc pt/sb', 'Obiad sb', 'Kolacja sb', 'Noc sb/nie', 'Obiad nie', 'Cena [PLN]'
    ]];

    // body (note: boolean columns are TRUE/FALSE now)
    const body = rows.map((r: any, i: number) => {
      const p = r.playerSpec?.personSpec ?? {};
      return [
        i + 1,
        r.clubName ?? '',
        p.lastname ?? '',
        p.firstname ?? '',
        room(r, p.gender ?? ''),
        r.playerSpec?.birthYear ?? '',
        r.playerSpec?.category ?? '',
        r.playerSpec?.games ?? '',

        mark(p.supperFri),
        mark(p.nightFriSat),
        mark(p.dinnerSat ?? r.dinnerSat),
        mark(p.supperSat),
        mark(p.nightSatSun),
        mark(p.dinnerSun),
        price(p.price),
      ];
    });

    // totals
    const totalGames = rows.reduce((s: number, r: any) => s + (Number(r.playerSpec?.games) || 0), 0);
    const cntSupperFri = rows.filter(r => !!r.playerSpec?.personSpec?.supperFri).length;
    const cntNightFriSat = rows.filter(r => !!r.playerSpec?.personSpec?.nightFriSat).length;
    const cntDinnerSat = rows.filter(r => (r.playerSpec?.personSpec?.dinnerSat ?? r?.dinnerSat) === true).length;
    const cntSupperSat = rows.filter(r => !!r.playerSpec?.personSpec?.supperSat).length;
    const cntNightSatSun = rows.filter(r => !!r.playerSpec?.personSpec?.nightSatSun).length;
    const cntDinnerSun = rows.filter(r => !!r.playerSpec?.personSpec?.dinnerSun).length;
    const totalPrice = rows.reduce((s: number, r: any) => s + (Number(r.playerSpec?.personSpec?.price) || 0), 0);

    const foot: RowInput[] = [[
      { content: 'Razem', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalGames), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(cntSupperFri), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: String(cntNightFriSat), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: String(cntDinnerSat), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: String(cntSupperSat), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: String(cntNightSatSun), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: String(cntDinnerSun), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: totalPrice.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
    ]];

    // which columns are boolean (0-based index)
    const CHECK_COLS = new Set([8, 9, 10, 11, 12, 13]);

    autoTable(doc, {
      startY,
      head,
      body,
      foot,
      styles: {
        font: 'Roboto-Regular',
        fontStyle: 'normal',
        fontSize: 10,
        cellPadding: 2
      },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
      columnStyles: {
        5: { halign: 'right' },  // Rok ur.
        7: { halign: 'right' },  // Liczba gier
        8: { halign: 'center' },
        9: { halign: 'center' },
        10: { halign: 'center' },
        11: { halign: 'center' },
        12: { halign: 'center' },
        13: { halign: 'center' },
        14: { halign: 'right' }   // Cena [PLN]
      },

      // 1) hide true/false text in boolean cells
      didParseCell: (d) => {
        if (d.section === 'body' && CHECK_COLS.has(d.column.index)) {
          d.cell.text = []; // suppress printing "true"/"false"
        }
      },

      // 2) draw a vector tick when raw value is true
      didDrawCell: (d) => {
        // draw ticks only in body rows and only in boolean columns
        if (d.section !== 'body' || !CHECK_COLS.has(d.column.index)) return;

        const isChecked = d.cell.raw === true;
        if (!isChecked) return;

        const { x, y, width, height } = d.cell;
        const cx = x + width / 2;
        const cy = y + height / 2;

        // ---- smaller check mark ----
        const SCALE = 0.20;                    // 0.25–0.35 gives a small/clean tick
        const s = Math.min(width, height) * SCALE;

        doc.setDrawColor(0);
        doc.setLineWidth(Math.max(0.2, s / 5)); // thinner stroke for small tick

        // two short segments forming ✓
        const x1 = cx - 0.6 * s, y1 = cy + 0.05 * s;
        const x2 = cx - 0.1 * s, y2 = cy + 0.8 * s;
        const x3 = cx + 0.9 * s, y3 = cy - 0.8 * s;

        doc.line(x1, y1, x2, y2);
        doc.line(x2, y2, x3, y3);
      }

    });

    const filename =
      `uczestnicy_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
    doc.save(filename);
    this.snackbar.showSuccess('PDF wygenerowany.');
  }


}
