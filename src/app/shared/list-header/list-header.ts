import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-list-header',
  imports: [CommonModule, MatFormFieldModule, MatIconModule, MatMenuModule, MatButtonModule, MatInputModule, MatDividerModule],
  templateUrl: './list-header.html',
  styleUrl: './list-header.scss'
})
export class ListHeader<T> implements OnInit{

  @Input() title: string = '';
  @Input() removeAllAreYouSure: string = '';
  @Input() removeAllConfirmation: string = '';
  @Input() showAll: string = '';
  @Input() showOnlyActive: string = '';
  @Input() itemsDataSource: MatTableDataSource<T> = new MatTableDataSource<T>();
  @Input() showExpand: boolean = true;
  @Input() showCoupons: boolean = false;
  @Input() service: any;
  @Output() itemsDataSourceChanged: EventEmitter<MatTableDataSource<T>> = new EventEmitter<MatTableDataSource<T>>();
  @Output() loadingChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() exportToCsvFile: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() exportShortToPdfFile: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() exportFullToPdfFile: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() couponRequested: EventEmitter<string> = new EventEmitter<string>();

  configFiles = false;
  activeOnly = true;

  @ViewChild(MatSort) sort!: MatSort;

  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.itemsDataSource.filter = filterValue.trim().toLowerCase();
    this.itemsDataSourceChanged.emit(this.itemsDataSource);
  }

  ngOnInit(): void {
    console.log("listHeader on Initttt")
    this.findAll();
  }

  findAll() {
    console.log("listheaderfindAll..................")
    this.loadingChanged.emit(true);
    if (this.service && typeof this.service.findAll === 'function') {
      this.service.findAll(this.activeOnly).subscribe({
        next: (data: any) => {
          this.itemsDataSource.data = data.data;
        },
        error: (e: any) => {
          this.loadingChanged.emit(false);
          this.snackBar.open(e.error.error.message, e.error.error.details);
        },
        complete: () => {
          this.loadingChanged.emit(false);
          this.itemsDataSource.sort = this.sort;
          this.itemsDataSourceChanged.emit(this.itemsDataSource);
        },
      });
    }
  }

  onDeleteAll() {
    console.log("onDeleteAll");
    /*
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      title: 'Potwierdzenie',
      message: this.removeAllAreYouSure,
    };
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.loadingChanged.emit(true);
        this.service.removeAll().subscribe({
          next: (data: any) => {
            this.snackBar.open(this.removeAllConfirmation, 'Zamknij');
          },
          error: (e: { error: { error: { message: string; details: string | undefined; }; }; }) => {
            this.loadingChanged.emit(false);
            this.snackBar.open(e.error.error.message, e.error.error.details);
          },
          complete: () => {
            this.loadingChanged.emit(false);
            this.findAll();
          },
        });
      }
    });
    */
  }
}
