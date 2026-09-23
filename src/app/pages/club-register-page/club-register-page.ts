import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HeaderPanel } from "../../shared/registration/header-panel/header-panel";
import { MatExpansionModule } from '@angular/material/expansion';
import { PriceService } from '../../_services/shared/price/price-service';
import { ClubRegisterPayload, RegistrationService } from '../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../_services/shared/snackbar/snackbar';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { ClubPanel } from "./club-panel/club-panel";
import { CoachesPanel, CoachRow } from "./coaches-panel/coaches-panel";
import { PlayerRow, PlayersPanel } from "./players-panel/players-panel";
import { MatBadgeModule } from '@angular/material/badge';
import { ContactPanel } from "./contact-panel/contact-panel";
import { CommentPanel } from "./comment-panel/comment-panel";
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { GeneralSettingsService } from '../../_services/general-settings/general-settings-service';

@Component({
  selector: 'app-club-register-page',
  imports: [MatExpansionModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    HeaderPanel, CurrencyPipe, ClubPanel, CoachesPanel, PlayersPanel,
    MatBadgeModule, ContactPanel, CommentPanel, MatProgressSpinnerModule],
  templateUrl: './club-register-page.html',
  styleUrl: './club-register-page.scss'
})
export class ClubRegisterPage {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private priceService = inject(PriceService);
  private registrationService = inject(RegistrationService);
  private route = inject(ActivatedRoute);
  private generalSettingsService = inject(GeneralSettingsService);
  loading = false;
  private snackbar = inject(SnackbarService);
  coachesRows: CoachRow[] = [];
  playersRows: PlayerRow[] = [];
  initialCoachesRows: CoachRow[] | null = null;
  initialPlayersRows: PlayerRow[] | null = null;
  wasSent = false;
  wasRemoved = false;
  editMode = false;
  isFamilyMode = false;
  registrationUuid: string | null = null;
  registrationClosed = false;
  private originalEmail: string | null = null;
  totalPrice = 0;
  coachesCount = 0;
  playersCount = 0;
  coachesTotalPrice = 0;
  playersTotalPrice = 0;

  emailExists = false;
  private existingEmailsSet = new Set<string>();

  form = this.fb.group({
    club: this.fb.group({
      name: ['', [Validators.required]],
      nip: ['', [Validators.pattern(/^\d{0,10}$/)]], //bez myślników
      streetNo: [''],
      zip_code: [''],
      city: [''],
    }),
    contact: this.fb.group({
      fullName: [''], // fully optional
      email: ['', [Validators.required, Validators.email]],
      repeatEmail: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\+?\d[\d\s\-()]{5,}$/)]],
    }, { validators: emailMatchValidator }),
    comment: this.fb.group({
      comment: ['', [Validators.maxLength(500)]],
    }),
  });

  get clubGroup(): FormGroup { return this.form.get('club') as FormGroup; }
  get contactGroup(): FormGroup { return this.form.get('contact') as FormGroup; }
  get commentGroup(): FormGroup { return this.form.get('comment') as FormGroup; }

  ngOnInit(): void {
    this.registrationUuid = this.route.snapshot.paramMap.get('uuid');
    this.editMode = !!this.registrationUuid;
    this.isFamilyMode = this.route.snapshot.routeConfig?.path?.startsWith('familyRegister') ?? false;
    this.configureClubForm();
    this.loadRegistrationClosedState();

    // Load already-used emails
    this.registrationService.readEmails().subscribe({
      next: (resp: any) => {
        const emails = Array.isArray(resp?.data) ? resp.data : [];
        this.existingEmailsSet = new Set(
          emails.map((e: string) => (e ?? '').trim().toLowerCase())
        );

        // Attach validator once we have the set, and revalidate
        const emailCtrl = this.contactGroup.get('email') as FormControl;
        emailCtrl.addValidators(this.emailTakenValidator());
        emailCtrl.updateValueAndValidity({ onlySelf: true });
      },
      error: () => { this.existingEmailsSet = new Set(); }
    });

    // (Optional) still keep a UI flag if you want to pass it down
    this.contactGroup.get('email')!.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(v => {
        const val = (v ?? '').toString().trim().toLowerCase();
        this.emailExists = !!val && this.existingEmailsSet.has(val) && val !== this.originalEmail;
      });

    if (this.registrationUuid) {
      this.loadRegistrationForEdit(this.registrationUuid);
    }
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

  private configureClubForm(): void {
    const nameControl = this.clubGroup.get('name');
    const familyOnlyDisabledControls = ['nip', 'streetNo', 'zip_code', 'city'];

    if (this.isFamilyMode) {
      nameControl?.setValidators([Validators.maxLength(200)]);
      familyOnlyDisabledControls.forEach(controlName =>
        this.clubGroup.get(controlName)?.disable({ emitEvent: false })
      );
    } else {
      nameControl?.setValidators([Validators.required, Validators.maxLength(200)]);
      familyOnlyDisabledControls.forEach(controlName =>
        this.clubGroup.get(controlName)?.enable({ emitEvent: false })
      );
    }

    nameControl?.updateValueAndValidity({ emitEvent: false });
    this.clubGroup.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private loadRegistrationForEdit(uuid: string): void {
    this.loading = true;
    const request$ = this.isFamilyMode ? this.registrationService.findFamilyByUuid(uuid) : this.registrationService.findClubByUuid(uuid);
    request$.subscribe({
      next: (data: ClubRegisterPayload) => {
        this.originalEmail = (data.contact?.email ?? '').trim().toLowerCase();
        this.clubGroup.patchValue(data.club ?? {});
        this.contactGroup.patchValue({
          ...(data.contact ?? {}),
          repeatEmail: data.contact?.repeatEmail ?? data.contact?.email ?? ''
        });
        this.commentGroup.patchValue({ comment: data.comment ?? '' });

        this.coachesRows = (data.coaches ?? []) as CoachRow[];
        this.playersRows = (data.players ?? []) as PlayerRow[];
        this.initialCoachesRows = [...this.coachesRows];
        this.initialPlayersRows = [...this.playersRows];

        this.coachesCount = this.coachesRows.length;
        this.playersCount = this.playersRows.length;
        this.coachesTotalPrice = this.coachesRows.reduce((sum, row) => sum + (row.fee ?? 0), 0);
        this.playersTotalPrice = this.playersRows.reduce((sum, row) => sum + (row.fee ?? 0), 0);
        this.applyRegistrationClosedState();
      },
      error: e => {
        this.wasRemoved = true;
        this.wasSent = true;
        this.form.disable();
        this.snackbar.showError('Nie znaleziono zgłoszenia do edycji albo zgłoszenie jest usunięte.', e);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }


  submit() {
    if (this.loading || this.wasSent || this.registrationClosed) { return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // 1) Read full objects from the sub-groups
    const clubRaw = this.clubGroup.getRawValue() as {
      name?: string | null; nip?: string | null; streetNo?: string | null; zip_code?: string | null; city?: string | null;
    };
    const contactRaw = this.contactGroup.getRawValue() as {
      fullName?: string | null; email?: string | null; repeatEmail?: string | null; phone?: string | null;
    };
    const commentRaw = this.commentGroup.getRawValue() as { comment?: string | null };

    // 2) Coerce to concrete API types
    const club: ClubRegisterPayload['club'] = {
      name: (clubRaw.name ?? '').trim(),
      nip: clubRaw.nip ?? '',
      streetNo: clubRaw.streetNo ?? '',
      zip_code: clubRaw.zip_code ?? '',
      city: clubRaw.city ?? '',
    };

    const contact: ClubRegisterPayload['contact'] = {
      fullName: (contactRaw.fullName ?? '') || undefined,   // optional
      email: contactRaw.email ?? '',
      repeatEmail: contactRaw.repeatEmail ?? '',
      phone: (contactRaw.phone ?? '') || undefined,         // optional
    };

    // Each guardian/player keeps their own selected nights.

    // 3) Ensure rows match your API types
    const coaches = this.coachesRows as unknown as ClubRegisterPayload['coaches'];
    const players = this.playersRows as unknown as ClubRegisterPayload['players'];

console.log("abc, this.coachesRows:", this.coachesRows)
console.log("abc, this.playersRows:", this.playersRows)

    // 4) Final payload satisfies ClubRegisterPayload
    const payload: ClubRegisterPayload = {
      club,
      coaches,
      players,
      contact,
      comment: commentRaw.comment ?? '',
      totals: {
        coachesTotalPrice: this.coachesTotalPrice,
        playersTotalPrice: this.playersTotalPrice,
        grandTotal: this.coachesTotalPrice + this.playersTotalPrice,
      },
    };

    console.log('Submitting:', payload);
    this.loading = true;
    const request$ = this.isFamilyMode
      ? (this.editMode && this.registrationUuid
          ? this.registrationService.updateFamilyByUuid(this.registrationUuid, payload)
          : this.registrationService.submitFamilyRegistration(payload))
      : (this.editMode && this.registrationUuid
          ? this.registrationService.updateClubByUuid(this.registrationUuid, payload)
          : this.registrationService.submitClubRegistration(payload));

    request$.subscribe({
      next: () => this.snackbar.showSuccess(
        this.editMode
          ? (this.isFamilyMode ? 'Zgłoszenie rodzinne zostało zaktualizowane.' : 'Zgłoszenie grupowe zostało zaktualizowane.')
          : 'Zgłoszenie przyjęte, czeka na weryfikację.'
      ),
      error: e => {
        this.loading = false;
        this.snackbar.showError(
          this.editMode
            ? 'Aktualizacja zgłoszenia grupowego zakończona niepowodzeniem'
            : 'Zgłoszenie grupowe zakończne niepowodzeniem',
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

    const confirmed = window.confirm(this.isFamilyMode ? 'Czy na pewno chcesz usunąć to zgłoszenie rodzinne?' : 'Czy na pewno chcesz usunąć to zgłoszenie grupowe?');
    if (!confirmed) {
      return;
    }

    this.loading = true;
    const request$ = this.isFamilyMode ? this.registrationService.removeFamilyByUuid(this.registrationUuid) : this.registrationService.removeClubByUuid(this.registrationUuid);
    request$.subscribe({
      next: () => {
        this.wasRemoved = true;
        this.wasSent = true;
        this.form.disable();
        this.snackbar.showSuccess(this.isFamilyMode ? 'Zgłoszenie rodzinne zostało usunięte.' : 'Zgłoszenie grupowe zostało usunięte.');
      },
      error: e => {
        this.loading = false;
        this.snackbar.showError('Usunięcie zgłoszenia grupowego zakończone niepowodzeniem', e);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  /** Validator: mark email as taken if it exists in the server set */
  private emailTakenValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const v = (ctrl.value ?? '').toString().trim().toLowerCase();
      if (!v) return null;                             // empty => let required/email validators handle it
      // Optional: don't show "taken" while it's not a syntactically valid email
      if (!/^\S+@\S+\.\S+$/.test(v)) return null;
      return this.existingEmailsSet.has(v) && v !== this.originalEmail ? { emailTaken: true } : null;
    };
  }
}

function emailMatchValidator(group: AbstractControl): ValidationErrors | null {
  const emailCtrl = group.get('email');
  const repeatCtrl = group.get('repeatEmail');
  if (!emailCtrl || !repeatCtrl) return null;

  const email = (emailCtrl.value ?? '').toString().trim();
  const repeat = (repeatCtrl.value ?? '').toString().trim();

  // If either field-level validator fails, clear mismatch flags and exit
  if (emailCtrl.invalid || repeatCtrl.invalid) {
    clearCtrlError(repeatCtrl, 'emailMismatch');
    clearGroupError(group, 'emailMismatch');
    return null;
  }

  const mismatch = !!email && !!repeat && email !== repeat;

  if (mismatch) {
    setCtrlError(repeatCtrl, 'emailMismatch');
    setGroupError(group, 'emailMismatch');   // optional but handy for form.hasError(...)
  } else {
    clearCtrlError(repeatCtrl, 'emailMismatch');
    clearGroupError(group, 'emailMismatch');
  }

  return mismatch ? { emailMismatch: true } : null;
}

function setCtrlError(ctrl: AbstractControl, key: string) {
  ctrl.setErrors({ ...(ctrl.errors ?? {}), [key]: true });
}
function clearCtrlError(ctrl: AbstractControl, key: string) {
  if (!ctrl.errors?.[key]) return;
  const { [key]: _removed, ...rest } = ctrl.errors!;
  ctrl.setErrors(Object.keys(rest).length ? rest : null);
}
function setGroupError(group: AbstractControl, key: string) {
  group.setErrors({ ...(group.errors ?? {}), [key]: true });
}
function clearGroupError(group: AbstractControl, key: string) {
  if (!group.errors?.[key]) return;
  const { [key]: _removed, ...rest } = group.errors!;
  group.setErrors(Object.keys(rest).length ? rest : null);
}
