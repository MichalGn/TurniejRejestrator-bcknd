import { Component, inject, Input } from '@angular/core';
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { GusService } from '../../../_services/gus/gus-service';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';

@Component({
  selector: 'app-club-panel',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './club-panel.html',
  styleUrl: './club-panel.scss'
})
export class ClubPanel {
  private readonly gusService = inject(GusService);
  private readonly snackbar = inject(SnackbarService);

  gusLoading = false;

  @Input({ required: true }) group!: FormGroup;
  @Input() familyMode = false;
  get f() { return this.group.controls as any; }

  get canLoadFromGus(): boolean {
    return this.normalizedNip.length === 10 && !this.gusLoading;
  }

  loadFromGus(): void {
    const nip = this.normalizedNip;
    if (nip.length !== 10) {
      this.group.get('nip')?.markAsTouched();
      this.snackbar.showWarning('Wpisz 10-cyfrowy NIP.');
      return;
    }

    this.gusLoading = true;
    this.gusService.findByNip(nip)
      .pipe(finalize(() => this.gusLoading = false))
      .subscribe({
        next: company => {
          this.group.patchValue({
            name: company.name,
            nip: company.nip,
            streetNo: company.streetNo,
            zip_code: company.zipCode,
            city: company.city
          });
          this.snackbar.showSuccess('Dane pobrano z GUS.');
        },
        error: error => {
          const message = error?.error?.error
            ?? (error?.status === 404
              ? 'Nie znaleziono podmiotu o podanym NIP.'
              : 'Nie udało się pobrać danych z GUS.');
          this.snackbar.showError(message);
        }
      });
  }

  onNipInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 10);

    input.value = digitsOnly;
    this.group.get('nip')?.setValue(digitsOnly, { emitEvent: false });
    this.group.get('nip')?.updateValueAndValidity({ emitEvent: false });
  }

  private get normalizedNip(): string {
    return String(this.group.get('nip')?.value ?? '').replace(/\D/g, '');
  }
}
