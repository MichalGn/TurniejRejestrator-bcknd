import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { BillService } from '../../../_services/bill/bill-service';
import { RegistrationService } from '../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { ConfirmationDialog } from '../../../shared/dialogs/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-panel',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './panel.html',
  styleUrl: './panel.scss'
})
export class Panel {
  @Output() statusChanged = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private registrationService = inject(RegistrationService);
  private billService = inject(BillService);
  private snackbar = inject(SnackbarService);

  loading = false;

  deleteAllRegistrations(): void {
    this.openConfirmation(
      'Usuń wszystkie zgłoszenia',
      'Czy na pewno chcesz usunąć wszystkie zgłoszenia? Tej operacji nie można cofnąć.',
      () => this.registrationService.deleteAll(),
      'Wszystkie zgłoszenia zostały usunięte.'
    );
  }

  deleteAllBills(): void {
    this.openConfirmation(
      'Usuń wszystkie rachunki',
      'Czy na pewno chcesz usunąć wszystkie rachunki? Tej operacji nie można cofnąć.',
      () => this.billService.deleteAll(),
      'Wszystkie rachunki zostały usunięte.'
    );
  }

  private openConfirmation(
    title: string,
    message: string,
    action: () => any,
    successMessage: string
  ): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = { title, message };

    this.dialog.open(ConfirmationDialog, dialogConfig)
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }

        this.loading = true;
        action()
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.snackbar.showSuccess(successMessage);
              this.statusChanged.emit();
            },
            error: (err: unknown) => {
              console.error(err);
              this.snackbar.showError('Operacja nie powiodła się.');
            }
          });
      });
  }
}
