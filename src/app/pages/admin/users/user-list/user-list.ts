import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ListHeader } from "../../../../shared/list-header/list-header";
import { UserData, UserService } from '../../../../_services/user/user-service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserDialog } from '../user-dialog/user-dialog';
import { ConfirmationDialog } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, ListHeader, MatProgressSpinnerModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserList {
  service = inject(UserService);
  cdr = inject(ChangeDetectorRef);
  readonly dialog = inject(MatDialog);
  @ViewChild(ListHeader) header!: ListHeader<UserList>;

  displayedColumns: string[] = ['rowNumber', 'username', 'firstname', 'lastname', 'active', 'actions'];
  dataSource = new MatTableDataSource<UserData>([]);
  loading = false;
  private snackbar = inject(SnackbarService);

  handleDataSourceChanged(updatedDataSource: MatTableDataSource<UserData>): void {
    this.dataSource = updatedDataSource;
  }

  handleLoadingChanged(loading: boolean): void {
    this.loading = loading;
    this.cdr.detectChanges();
  }

  openUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialog, {
      disableClose: true,
      data: {
        username: '',
        firstname: '',
        lastname: '',
        password: '',
        isAdmin: false
      },
    });

    dialogRef.afterClosed().subscribe(result => {
       this.header.findAll();
    });
  }

  editUser(user: UserData): void {
    const dialogRef = this.dialog.open(UserDialog, {
      disableClose: true,
      data: { ...user },
    });

    dialogRef.afterClosed().subscribe(updatedUser => {
         this.header.findAll();
    });
  }

  delete(item: UserData): void {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.restoreFocus = false;
    dialogConfig.data = {
      title: 'Potwierdzenie',
      message: `Czy na pewno usunąć użytkownika: ${item.username}?`,
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, dialogConfig);

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        if (item.id !== undefined) {
          this.loading = true;
          this.service.delete(item.id).subscribe({
            next: () => {
              this.snackbar.showSuccess(`Użytkownik ${item.username} usunięty poprawnie`);
            },
            error: e => {
              this.loading = false;
              this.snackbar.showError('Usunięcie użytkownika zakończone niepowodzeniem', e);
            },
            complete: () => {
              this.loading = false;
              this.header.findAll();
            },
          });
        } else {
          this.snackbar.showError('Nie można usunąć użytkownika bez ID.');
        }
      }
    });
    
  }

  
}
