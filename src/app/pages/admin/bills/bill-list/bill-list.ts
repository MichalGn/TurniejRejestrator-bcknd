import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ListHeader } from "../../../../shared/list-header/list-header";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BillData, BillService } from '../../../../_services/bill/bill-service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillDialog } from '../bill-dialog/bill-dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { generateBillPdf } from '../../../../_services/bill/bill-pdf-generator';
import { GeneralSettingsStorageService } from '../../../../_services/general-settings/general-settings-storage-service';
import { ConfirmationDialog } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-bill-list',
  imports: [CommonModule, ListHeader, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatButtonModule, MatTooltipModule, MatSortModule],
  templateUrl: './bill-list.html',
  styleUrl: './bill-list.scss'
})
export class BillList implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<BillData>([]);
  private store = inject(GeneralSettingsStorageService);
  service = inject(BillService);

  readonly dialog = inject(MatDialog);
  @ViewChild(ListHeader) header!: ListHeader<BillList>;

  displayedColumns: string[] = ['rowNumber', 'billFullNumber', 'datetime', 'clubName', 'purchaser', 'billTotalValueCash', 'billTotalValueTransfer', 'actions'];
  loading = false;
  private snackbar = inject(SnackbarService);

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (row: BillData, prop: string) => {
      switch (prop) {
        case 'datetime': return this.toDate(row.datetime)?.getTime() ?? 0;
        case 'billTotalValueCash':
        case 'billTotalValueTransfer':
          return this.toNumber((row as any)[prop]);
        default:
          const v = (row as any)[prop];
          return typeof v === 'string' ? v.toLowerCase() : v ?? '';
      }
    };
  }

private toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v == null) return 0;

  // tolerate: "1 234,56 zł", "1 234,56 zł", "1234.56", "1,234.56", etc.
  let s = String(v)
    .replace(/\u00A0/g, '')   // NBSP
    .replace(/\s+/g, '')      // spaces
    .replace(/[^\d,.\-]/g, ''); // strip currency & other symbols

  // If there’s exactly one comma and no dot -> Polish decimal
  const hasDot = s.includes('.');
  const commaCount = (s.match(/,/g) || []).length;
  if (!hasDot && commaCount === 1) s = s.replace(',', '.');
  else s = s.replace(/,/g, ''); // treat commas as thousands

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

  get totalCash(): number {
    return this.dataSource.data.reduce((acc, r) => acc + this.toNumber((r as any).billTotalValueCash), 0);
  }

  get totalTransfer(): number {
    return this.dataSource.data.reduce((acc, r) => acc + this.toNumber((r as any).billTotalValueTransfer), 0);
  }

  ngOnInit(): void {
    this.readAll();
  }

  readAll(): void {
    this.loading = true;
    this.service.readAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: (resp: any) => {
        const rows: BillData[] =
          Array.isArray(resp?.data) ? resp.data :
            Array.isArray(resp?.items) ? resp.items :
              Array.isArray(resp) ? resp : [];
        this.dataSource.data = rows;
      },
      error: (err: HttpErrorResponse) => {
        const msg = err?.error?.message ?? 'Unknown error';
        this.snackbar.showError('Błąd w pobieraniu listy rachunków. ' + msg);
      }
    });
  }

  addBill() {
    this.openBillDialog(null);
  }

  editBill(item: any): void {
    console.log("edit bill, item:", item);
    if (item.billId !== undefined) {
      this.openBillDialog(item.billId);
    }
  }

  openBillDialog(billId: number | null): void {
    const dialogRef = this.dialog.open(BillDialog, {
      disableClose: true,
      data: {
        registrationId: null,
        billId: billId,
      },
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '95vh',
      panelClass: 'bill-dialog-fill',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.header?.findAll?.();
      this.readAll();
    });
  }

  deleteBill(item: any): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.restoreFocus = false;
    dialogConfig.data = {
      title: 'Potwierdzenie',
      message: `Czy na pewno usunąć rachunek: ${item.billFullNumber}?`,
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, dialogConfig);

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        if (item.billId !== undefined) {
          this.loading = true;
          this.service.delete(item.billId).subscribe({
            next: () => {
              this.snackbar.showSuccess(`Rachunek ${item.billFullNumber} usunięty poprawnie`);
            },
            error: (e: HttpErrorResponse) => {
              this.loading = false;
              this.snackbar.showError('Usunięcie rachunkuzakończone niepowodzeniem', e.error);
            },
            complete: () => {
              this.loading = false;
              this.header.findAll();
              this.readAll();
            },
          });
        } else {
          this.snackbar.showError('Nie można usunąć rachunku.');
        }
      }
    });
  }

  handleDataSourceChanged() { }
  handleLoadingChanged() { }




handleExportToCsvFile() {
  const rows = this.orderedRows();
  if (!rows.length) {
    this.snackbar.showWarning('Brak danych do eksportu.');
    return;
  }

  const SEP = ';';
  const esc = (v: any): string => {
    const s = (v ?? '').toString();
    return (s.includes('"') || s.includes('\n') || s.includes(SEP))
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const PLN = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 });
  const totalRows = rows.length;

  const isCash = (m: string) => m?.toUpperCase() === 'CASH';
  const isTransfer = (m: string) => m?.toUpperCase().startsWith('TRANSFER');

  let sumCash = 0;
  let sumTransfer = 0;

  const header = [
    '#','Numer rachunku','Data','Klub','Nabywca','Gotówka [PLN]','Przelew [PLN]'
  ];

  const bodyLines = rows.map((r, idx) => {
    const revNo = totalRows - idx;
    const dt = this.fmtDatePL(this.toDate(r.datetime));
    const club = [r.clubName, r.streetNo, r.city].filter(Boolean).join(', ');

    const method = String((r as any).paymentMethod ?? '');
    const rawCash = this.toNumber((r as any).billTotalValueCash);
    const rawTransfer = this.toNumber((r as any).billTotalValueTransfer);
    const amount = rawCash || rawTransfer; // prefer whichever is filled

    let cellCash = '';
    let cellTransfer = '';

    if (isCash(method)) {
      cellCash = amount ? PLN.format(amount) : '';
      sumCash += amount;
    } else if (isTransfer(method)) {
      cellTransfer = amount ? PLN.format(amount) : '';
      sumTransfer += amount;
    } else {                  // fallback: show both as recorded
      cellCash = rawCash ? PLN.format(rawCash) : '';
      cellTransfer = rawTransfer ? PLN.format(rawTransfer) : '';
      sumCash += rawCash;
      sumTransfer += rawTransfer;
    }

    const cells = [
      revNo,
      r.billFullNumber ?? '',
      dt,
      club,
      r.purchaser ?? '',
      cellCash,
      cellTransfer
    ];
    return cells.map(esc).join(SEP);
  });

  const footer = [
    '', '', '', '', 'RAZEM:', PLN.format(sumCash), PLN.format(sumTransfer)
  ].map(esc).join(SEP);

  const filter = (this.dataSource.filter || '').trim();
  const topLines = filter
    ? [`Filtr: ${filter} — wyników: ${rows.length} / ${this.dataSource.data.length}`, '']
    : [];

  const csv = '\uFEFF' + [
    ...topLines,
    header.map(esc).join(SEP),
    ...bodyLines,
    footer
  ].join('\r\n');

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fname = `rachunki_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);

  this.snackbar.showSuccess('Eksport CSV gotowy.');
}




handleExportToPdfFile() {
  const rows = this.orderedRows();
  if (!rows.length) {
    this.snackbar.showWarning('Brak danych do eksportu.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFont('Roboto-Regular', 'normal');

  const PLN = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const BLUE = [41,128,185] as [number,number,number];
  const WHITE = [255,255,255] as [number,number,number];
  const GREY  = [245,245,245] as [number,number,number];
  const ALT   = [250,250,250] as [number,number,number];

  // Header
  doc.setFontSize(8);
  doc.text('Raport', 10, 10);
  doc.text(`Data: ${dateStr}`, pageWidth - 10, 10, { align: 'right' });
  doc.setFontSize(12);
  doc.text('Lista rachunków', pageWidth / 2, 18, { align: 'center' });

  // Optional filter
  let startY = 28;
  const activeFilter = (this.dataSource.filter || '').trim();
  if (activeFilter) {
    doc.setFontSize(10);
    const info = `Filtr: ${activeFilter} — wyników: ${rows.length} / ${this.dataSource.data.length}`;
    const wrapped = doc.splitTextToSize(info, pageWidth - 20);
    doc.text(wrapped, 10, 22);
    startY = 22 + wrapped.length * 5 + 2;
  }

  const head = [[
    '#','Numer rachunku','Data','Klub','Nabywca','Gotówka [PLN]','Przelew [PLN]'
  ]];

  const isCash = (m: string) => m?.toUpperCase() === 'CASH';
  const isTransfer = (m: string) => m?.toUpperCase().startsWith('TRANSFER');

  // Body + visible totals
  const totalRows = rows.length;
  let sumCash = 0;
  let sumTransfer = 0;

  const body = rows.map((r, idx) => {
    const revNo = totalRows - idx;
    const dt = this.fmtDatePL(this.toDate(r.datetime));
    const club = [r.clubName, r.streetNo, r.city].filter(Boolean).join(', ');

    const method = String((r as any).paymentMethod ?? '');
    const rawCash = this.toNumber((r as any).billTotalValueCash);
    const rawTransfer = this.toNumber((r as any).billTotalValueTransfer);
    const amount = rawCash || rawTransfer;

    let cellCash = '';
    let cellTransfer = '';

    if (isCash(method)) {
      if (amount) { cellCash = PLN.format(amount); sumCash += amount; }
    } else if (isTransfer(method)) {
      if (amount) { cellTransfer = PLN.format(amount); sumTransfer += amount; }
    } else {
      if (rawCash)     { cellCash = PLN.format(rawCash); sumCash += rawCash; }
      if (rawTransfer) { cellTransfer = PLN.format(rawTransfer); sumTransfer += rawTransfer; }
    }

    return [revNo, r.billFullNumber ?? '', dt, club, r.purchaser ?? '', cellCash, cellTransfer];
  });

  // “RAZEM” as the last body row (with bold font to keep diacritics correct)
  body.push([
    { content: '', styles: { fillColor: GREY, font: 'Roboto-Bold' } },
    { content: '', styles: { fillColor: GREY, font: 'Roboto-Bold' } },
    { content: '', styles: { fillColor: GREY, font: 'Roboto-Bold' } },
    { content: '', styles: { fillColor: GREY, font: 'Roboto-Bold' } },
    { content: 'RAZEM:', styles: { fillColor: GREY, font: 'Roboto-Bold', halign: 'right' as const } },
    { content: PLN.format(sumCash), styles: { fillColor: GREY, font: 'Roboto-Bold', halign: 'right' as const } },
    { content: PLN.format(sumTransfer), styles: { fillColor: GREY, font: 'Roboto-Bold', halign: 'right' as const } },
  ] as any);

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    styles: { font: 'Roboto-Regular', fontSize: 10, cellPadding: 2, lineWidth: 0.2, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: BLUE, textColor: WHITE },
    alternateRowStyles: { fillColor: ALT },
    columnStyles: {
      0: { halign: 'right' as const, cellWidth: 12 },
      1: { halign: 'right' as const, cellWidth: 35 },
      2: { halign: 'right' as const, cellWidth: 40 },
      3: { halign: 'left'  as const, cellWidth: 70 },
      4: { halign: 'left'  as const },
      5: { halign: 'right' as const, cellWidth: 32 },
      6: { halign: 'right' as const, cellWidth: 32 },
    },
    margin: { left: 10, right: 10, top: 10, bottom: 12 },
  });

  const fname = `rachunki_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
  doc.save(fname);
  this.snackbar.showSuccess('PDF wygenerowany.');
}








  toDate(dt?: number[] | string | Date | null): Date | null {
    if (!dt) return null;

    if (Array.isArray(dt)) {
      const [y, m, d, h = 0, min = 0, s = 0, ns = 0] = dt;
      return new Date(y, m - 1, d, h, min, s, Math.floor(ns / 1e6));
    }

    if (dt instanceof Date) return dt;

    if (typeof dt === 'string') {
      const parsed = new Date(dt);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  exportBillToPdf(item: any): void {
    const settings = this.store.getBillSettingsSnapshot();
    generateBillPdf(item, settings, true);
  }

  // Add these 2 small helpers inside the BillList class (near your other helpers)

  private orderedRows(): any[] {
    // what the table renders: filtered then (if present) sorted
    const base = (this.dataSource.filteredData ?? []).slice();
    return this.sort ? this.dataSource.sortData(base, this.sort) : base;
  }

  private fmtDatePL(dt: Date | null): string {
    if (!dt) return '—';
    const pad = (n: number) => String(n).padStart(2, '0');
    // format: yyyy-MM-dd HH:mm:ss in Europe/Warsaw (like the template)
    const z = new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(dt).reduce((acc: any, p) => (acc[p.type] = p.value, acc), {});
    return `${z.year}-${z.month}-${z.day} ${z.hour}:${z.minute}:${z.second}`;
  }

}
