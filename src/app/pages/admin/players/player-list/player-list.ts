import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { RegistrationService } from '../../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ListHeader } from "../../../../shared/list-header/list-header";
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import jsPDF from 'jspdf';
import autoTable, { CellDef, RowInput } from 'jspdf-autotable';
import '../../../../../../public/fonts/Roboto-Regular-normal.js';
import '../../../../../../public/fonts/Roboto-Bold-normal.js';
import '../../../../../../public/fonts/Roboto-Italic-normal.js';
import { GeneralSettingsService } from '../../../../_services/general-settings/general-settings-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-player-list',
  imports: [CommonModule, ListHeader, MatTableModule, MatProgressSpinnerModule, MatIconModule, MatSortModule],
  templateUrl: './player-list.html',
  styleUrl: './player-list.scss'
})
export class PlayerList implements OnInit {

  private registrationService = inject(RegistrationService)


  @ViewChild(MatSort) sort!: MatSort;

  title: string = 'Lista zawodników';
  pdfTitle: string = '';
  service = inject(RegistrationService)
  private generalSettingsService = inject(GeneralSettingsService);
  loading = false;
  private snackbar = inject(SnackbarService);
  displayedColumns: string[] = ['rowNumber', 'clubName', 'lastname', 'firstname', 'gender', 'birthYear', 'category', 'games'];

  dataSource = new MatTableDataSource<any>([]);

  ngAfterViewInit() {
    //sorting
    this.dataSource.sortingDataAccessor = (row: any, column: string) => {
      switch (column) {
        case 'clubName': return row.clubName ?? '';
        case 'lastname': return row.playerSpec?.personSpec?.lastname ?? '';
        case 'firstname': return row.playerSpec?.personSpec?.firstname ?? '';
        case 'gender': return this.getGender(row.playerSpec?.personSpec?.gender ?? '').toLowerCase();
        case 'birthYear': return Number(row.playerSpec?.birthYear) || 0;
        case 'category': return row.playerSpec?.category ?? '';
        case 'games': return Number(row.playerSpec?.games) || 0;
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
        this.getGender(p.gender),                 // pokój as text
        row.playerSpec?.birthYear,
        row.playerSpec?.category,
        row.playerSpec?.games,
      ].map(t).join(' ');

      return flat.includes(filter.trim().toLowerCase());
    }
  }

  ngOnInit(): void {
    // 1) Title — independent, no spinner
    this.generalSettingsService.findByKey1('title').subscribe({
      next: (res: any) => this.pdfTitle = res?.data ?? res?.value1 ?? '',
      error: (e) => console.error('Failed to load title', e),
    });

    // 2) Players — independent, with spinner
    this.loading = true;
    this.registrationService.readPlayers()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (resp: any) => {
          const rows =
            Array.isArray(resp) ? resp :
              Array.isArray(resp?.data) ? resp.data :
                Array.isArray(resp?.items) ? resp.items : [];

          this.dataSource.data = rows; // keep same instance
          if (this.sort) this.dataSource.sort = this.sort;
        },
        error: (err: HttpErrorResponse) => {
          const msg = err?.error?.message ?? 'Unknown error';
          this.snackbar.showError('Błąd w pobieraniu listy zawodników. ' + msg);
        }
      });
  }

  handleDataSourceChanged(updatedDataSource: MatTableDataSource<any>): void {
    // this.dataSource = updatedDataSource;
  }

  handleLoadingChanged(loading: boolean): void {
    this.loading = loading;
    //this.cdr.detectChanges();
  }

  getGender(gender: string): string {
    switch (gender) {
      case 'm': return "m";
      case 'f': return "k";
      default: return "?";
    }
  }

  get rows(): any[] { return this.dataSource?.filteredData ?? []; }

  get totalGames(): number {
    return this.rows.reduce((s, r) => s + (Number(r.playerSpec?.games) || 0), 0);
  }

  handleExportToCsvFile() {
    console.log("handleExport2CsvFile aaa");

    const rows = this.dataSource.filteredData;
    if (!rows.length) {
      this.snackbar.showWarning("Brak danych do eksportu.");
      return;
    }

    // Prepare CSV content
    const header = ['#', 'Klub', 'Nazwisko', 'Imię', 'Płeć', 'Rok ur.', 'Kategoria', 'Liczba_gier'];
    const csvRows = [
      header.join(';'),
      ...rows.map((item, index) => [
        index + 1,
        item.clubName ?? '',
        item.playerSpec?.personSpec?.lastname ?? '',
        item.playerSpec?.personSpec?.firstname ?? '',
        this.getGender(item.playerSpec?.personSpec?.gender ?? ''),
        item.playerSpec?.birthYear ?? '',
        item.playerSpec?.category ?? '',
        item.playerSpec?.games ?? '',
      ].join(';'))
    ];

    const csvContent = csvRows.join('\r\n');

    // Generate filename
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const filename = `zawodnicy_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackbar.showSuccess("Eksport zakończony sukcesem.");
  }

  handleExportToPdfFile() {
    const rows = this.dataSource.filteredData;
    if (!rows.length) {
      this.snackbar.showWarning("Brak danych do eksportu.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    // ---- register custom font (once per document) ----
    doc.setFont('Roboto-Regular', 'normal');

    // date (top-right)
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    doc.setFontSize(8);
    doc.text(`Data: ${dateStr}`, pageWidth - 10, 10, { align: 'right' });

    // === Festival title (top-left) ===
    //doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(this.pdfTitle, 10, 12);            // top-left

    // --- Show active filter in PDF (if any) ---
    let startY = 30;                        // default table start
    const activeFilter = (this.dataSource.filter || '').trim();
    if (activeFilter) {
      doc.setFont('Roboto-Regular', 'normal');
      doc.setFontSize(10);

      const info = `Filtr: ${activeFilter} — wyników: ${rows.length} / ${this.dataSource.data.length}`;
      // wrap long filters to page width
      const wrapped = doc.splitTextToSize(info, pageWidth - 20); // 10pt margins
      const filterTop = 26; // just below the title at y=22

      doc.text(wrapped, 10, filterTop);     // left-aligned
      // push table below the wrapped text
      const lineHeight = 6;                 // jsPDF 10pt ≈ 6px line height
      startY = filterTop + wrapped.length * lineHeight + 4;
    }



    // If you prefer centered instead, replace the line above with:
    // doc.text(festivalTitle, pageWidth / 2, 12, { align: 'center' });

    // Section title (center)
    //doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Lista zawodników', pageWidth / 2, 22, { align: 'center' });

    // Table
    const head = [['#', 'Klub', 'Nazwisko', 'Imię', 'Płeć', 'Rok ur.', 'Kategoria', 'Liczba gier']];
    const body = rows.map((item: any, index: number) => [
      index + 1,
      item.clubName ?? '',
      item.playerSpec?.personSpec?.lastname ?? '',
      item.playerSpec?.personSpec?.firstname ?? '',
      this.getGender(item.playerSpec?.personSpec?.gender ?? ''),
      item.playerSpec?.birthYear ?? '',
      item.playerSpec?.category ?? '',
      item.playerSpec?.games ?? ''
    ]);

    // sum for footer
    const totalGames = rows.reduce((s: number, r: any) => s + (Number(r.playerSpec?.games) || 0), 0);

    // footer: "Razem" spans all columns except the last one; total in the last
    // const foot = [[
    //   { content: 'Razem', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
    //   { content: String(totalGames), styles: { halign: 'right', fontStyle: 'bold' } }
    // ]];
    // one footer row, first cell spans 7 cols, last cell shows the sum
    const footRow: CellDef[] = [
      { content: 'Razem', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalGames), styles: { halign: 'right', fontStyle: 'bold' } }
    ];
    const foot: RowInput[] = [footRow];

    autoTable(doc, {
      startY,//: 30, // leaves room for the titles
      head,
      body,
      foot,  //hey, chat bot the error is from this line
      styles: {
        font: 'Roboto-Regular',
        fontStyle: 'normal',
        fontSize: 10,
        cellPadding: 2
      },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        5: { halign: 'right' },  // "Rok ur." right-aligned
        7: { halign: 'right' }   // "Liczba gier" right-aligned
      }
    });

    const filename = `zawodnicy_${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
    doc.save(filename);
    this.snackbar.showSuccess("PDF wygenerowany.");
  }

}