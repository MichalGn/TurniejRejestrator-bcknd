import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HeaderPanel } from "../../shared/registration/header-panel/header-panel";
import { PriceService } from '../../_services/shared/price/price-service';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import '@angular/common/locales/global/pl';
import { Category, Games, Gender, IndividualRegisterData, RegistrationService } from '../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../_services/shared/snackbar/snackbar';
import { distinctUntilChanged } from 'rxjs/operators';
import { AccomodationAndMeal } from "../../shared/accomodation-and-meal/accomodation-and-meal";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from '@angular/router';
import { GeneralSettingsService } from '../../_services/general-settings/general-settings-service';


@Component({
  selector: 'app-individual-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, HeaderPanel, CurrencyPipe,
    AccomodationAndMeal,
    MatProgressSpinnerModule
  ],
  templateUrl: './individual-register-page.html',
  styleUrl: './individual-register-page.scss'
})
export class IndividualRegisterPage implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private priceService = inject(PriceService);
  private registrationService = inject(RegistrationService);
  private route = inject(ActivatedRoute);
  private generalSettingsService = inject(GeneralSettingsService);
  loading = false;
  private snackbar = inject(SnackbarService);
  emailExists: boolean = false;
  private existingEmailsSet = new Set<string>();
  wasSent = false;
  wasRemoved = false;
  editMode = false;
  registrationUuid: string | null = null;
  registrationClosed = false;
  private originalEmail: string | null = null;
  maxYear = new Date().getFullYear();

  /** The reactive form model */
  form = this.fb.nonNullable.group({
    firstname: ['', [Validators.required, Validators.minLength(3)]],
    lastname: ['', [Validators.required, Validators.minLength(3)]],
    birthYear: this.fb.control<number | null>(
      null,
      [Validators.required, Validators.min(1900), Validators.max(this.maxYear)]
    ),
    gender: this.fb.control<Gender | null>(null, Validators.required),
    category: this.fb.control<Category | null>(null, Validators.required),
    games: this.fb.control<Games | null>(null, Validators.required),
    nightFriSat: [false],
    supperFri: [false],
    dinnerSat: [false],
    nightSatSun: [false],
    supperSat: [false],
    dinnerSun: [false],

    city: ['', Validators.required],
    comment: ['', [Validators.maxLength(500)]],
    email: ['', [Validators.required, Validators.email]],
    repeatEmail: ['', [Validators.required, Validators.email]],
  }, { validators: [emailMatchValidator] });

  totalPrice = 0;

  ngOnInit(): void {
    this.registrationUuid = this.route.snapshot.paramMap.get('uuid');
    this.editMode = !!this.registrationUuid;
    this.loadRegistrationClosedState();

    this.loadExistingEmails();

    if (this.registrationUuid) {
      this.loadRegistrationForEdit(this.registrationUuid);
    }

    this.f.category.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(category => this.applyCategoryRules(category));

    this.applyCategoryRules(this.f.category.value);

    // Initial calculation
    this.recalcPrice();

    // Recalculate once for any change in any field
    this.form.valueChanges
      .pipe(debounceTime(120), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalcPrice());
  }

  private loadRegistrationClosedState(): void {
    this.generalSettingsService.isRegistrationClosed().subscribe(closed => {
      this.registrationClosed = closed;
      this.applyRegistrationClosedState();
    });
  }

  private applyRegistrationClosedState(): void {
    if (this.registrationClosed) {
      this.form.disable({ emitEvent: false });
    }
  }

  private loadExistingEmails(): void {
    this.loading = true;
    this.registrationService.readEmails().subscribe({
      next: (response: any) => {
        this.loading = false;

        const emails = Array.isArray(response?.data) ? response.data : [];
        this.existingEmailsSet = new Set(
          emails.map((e: string) => (e ?? '').trim().toLowerCase())
        );

        // subscribe to email changes once we have the set
        this.f.email.valueChanges
          .pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
          .subscribe(email => {
            const val = (email ?? '').toString().trim().toLowerCase();
            this.emailExists = !!val
              && this.existingEmailsSet.has(val)
              && val !== this.originalEmail;
          });
      },
      error: (err) => {
        this.loading = false;
        this.existingEmailsSet = new Set();
        console.error('Error loading registration emails', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private loadRegistrationForEdit(uuid: string): void {
    this.loading = true;
    this.registrationService.findIndividualByUuid(uuid).subscribe({
      next: (data: IndividualRegisterData) => {
        this.originalEmail = (data.email ?? '').trim().toLowerCase();
        this.form.patchValue({
          firstname: data.firstname ?? '',
          lastname: data.lastname ?? '',
          birthYear: data.birthYear ?? null,
          gender: data.gender ?? null,
          category: data.category ?? null,
          games: data.games ?? null,
          nightFriSat: !!data.nightFriSat,
          supperFri: !!data.supperFri,
          dinnerSat: !!data.dinnerSat,
          nightSatSun: !!data.nightSatSun,
          supperSat: !!data.supperSat,
          dinnerSun: !!data.dinnerSun,
          city: data.city ?? '',
          comment: data.comment ?? '',
          email: data.email ?? '',
          repeatEmail: data.repeatEmail ?? data.email ?? '',
        });
        this.recalcPrice();
        this.applyRegistrationClosedState();
      },
      error: err => {
        this.snackbar.showError('Nie znaleziono zgłoszenia do edycji', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; } // convenience in template

  submit(): void {
    if (this.loading || this.wasSent || this.registrationClosed) { return; }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: IndividualRegisterData = { 
      id: undefined,
      ...this.form.getRawValue(),
      price: this.totalPrice
    };
    console.log('Submitting:', payload);

    this.loading = true;
    const request$ = this.editMode && this.registrationUuid
      ? this.registrationService.updateIndividualByUuid(this.registrationUuid, payload)
      : this.registrationService.individualRegister(payload);

    request$.subscribe({
      next: () => {
        this.snackbar.showSuccess(
          this.editMode
            ? 'Zgłoszenie zostało zaktualizowane.'
            : 'Zgłoszenie przyjęte, czeka na weryfikację.'
        );
      },
      error: e => {
        this.loading = false;
        this.snackbar.showError(
          this.editMode
            ? 'Aktualizacja zgłoszenia zakończona niepowodzeniem'
            : 'Zgłoszenie indywidualne zakończne niepowodzeniem',
          e
        );
      },
      complete: () => {
        this.loading = false;
        this.wasSent = true;
      },
    });

  }

  removeRegistration(): void {
    if (!this.editMode || !this.registrationUuid || this.loading || this.wasSent || this.registrationClosed) {
      return;
    }

    const confirmed = window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?');
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.registrationService.removeIndividualByUuid(this.registrationUuid).subscribe({
      next: () => {
        this.wasRemoved = true;
        this.wasSent = true;
        this.form.disable();
        this.snackbar.showSuccess('Zgłoszenie zostało usunięte.');
      },
      error: e => {
        this.loading = false;
        this.snackbar.showError('Usunięcie zgłoszenia zakończone niepowodzeniem', e);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }


  private applyCategoryRules(category: Category): void {
    const gamesControl = this.f.games;
    const dinnerSatControl = this.f.dinnerSat;

    if (category === 'ZAK') {
      gamesControl.setValue('1g', { emitEvent: false });
      gamesControl.disable({ emitEvent: false });

      dinnerSatControl.enable({ emitEvent: false });
      dinnerSatControl.setValue(false, { emitEvent: false });
    } else {
      gamesControl.enable({ emitEvent: false });
      dinnerSatControl.setValue(true, { emitEvent: false });
      dinnerSatControl.disable({ emitEvent: false });
    }

    this.recalcPrice();
    this.applyRegistrationClosedState();
  }

  private recalcPrice(): void {
    console.log("recalcPrice")
    const v = this.form.getRawValue();
    this.totalPrice = this.priceService.calculateTotalPlayer({
      //gender: v.gender,
      category: v.category,
      games: v.games,
      nights: { friSat: v.nightFriSat, satSun: v.nightSatSun },
      meals: { supperFri: v.supperFri, dinnerSat: v.dinnerSat, supperSat: v.supperSat, dinnerSun: v.dinnerSun }
    });
  }
}

/** Group-level validator for matching emails */
/*
function x_emailMatchValidator(group: AbstractControl): ValidationErrors | null {
  const email = group.get('email')?.value;
  const repeat = group.get('repeatEmail')?.value;
  return email && repeat && email !== repeat ? { emailMismatch: true } : null;
}
*/
function emailMatchValidator(group: AbstractControl): ValidationErrors | null {
  const emailCtrl = group.get('email');
  const repeatCtrl = group.get('repeatEmail');

  if (!emailCtrl || !repeatCtrl) return null;
  if (repeatCtrl.disabled) return null; // nie sprawdzaj, gdy pole wyłączone

  const email = (emailCtrl.value ?? '').trim();
  const repeat = (repeatCtrl.value ?? '').trim();

  // Najpierw czekamy aż oba pola przejdą swoje własne walidacje (wzorzec email itp.)
  if (emailCtrl.invalid || repeatCtrl.invalid) {
    // usuń nasz błąd, jeśli był ustawiony wcześniej
    if (repeatCtrl.hasError('emailMismatch')) {
      const { emailMismatch, ...rest } = repeatCtrl.errors ?? {};
      repeatCtrl.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }

  const mismatch = !!email && !!repeat && email !== repeat;

  if (mismatch) {
    repeatCtrl.setErrors({ ...(repeatCtrl.errors ?? {}), emailMismatch: true });
  } else if (repeatCtrl.hasError('emailMismatch')) {
    const { emailMismatch, ...rest } = repeatCtrl.errors ?? {};
    repeatCtrl.setErrors(Object.keys(rest).length ? rest : null);
  }

  return null; // błąd “żyje” na kontrolce, nie na grupie
}