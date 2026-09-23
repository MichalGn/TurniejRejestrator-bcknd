import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from "@angular/material/input";
import { RegistrationService } from '../../../_services/shared/registration/registration-service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

type ContactForm = FormGroup<{
  fullName: FormControl<string>;
  email: FormControl<string>;
  repeatEmail: FormControl<string>;
  phone: FormControl<string>;
}>;

@Component({
  selector: 'app-contact-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
  templateUrl: './contact-panel.html',
  styleUrl: './contact-panel.scss'
})
export class ContactPanel implements OnInit {
  @Input({ required: true }) group!: FormGroup;
  @Input() emailExists = false;
  private registrationService = inject(RegistrationService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder).nonNullable; // typed, non-nullable controls

  loading = false;
  //emailExists = false;
  private existingEmailsSet = new Set<string>();

  /** ✅ Declare validator BEFORE using it in the form initializer */
  private emailMatchValidator: ValidatorFn = (group) => {
    const emailCtrl = group.get('email');
    const repeatCtrl = group.get('repeatEmail');
    if (!emailCtrl || !repeatCtrl) return null;

    const email = (emailCtrl.value ?? '').toString().trim();
    const repeat = (repeatCtrl.value ?? '').toString().trim();

    // Don’t show mismatch while field-level email validators fail
    if (emailCtrl.invalid || repeatCtrl.invalid) {
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

    // optional: also put the flag on the group if you use form.hasError(...) elsewhere
    return mismatch ? { emailMismatch: true } : null;
  };
  // private emailMatchValidator: ValidatorFn = (group) => {
  //   const e = group.get('email')?.value ?? '';
  //   const r = group.get('repeatEmail')?.value ?? '';
  //   return e && r && e !== r ? { emailMismatch: true } : null;
  // };

  /** The form can now safely reference the validator */
  form: ContactForm = this.fb.group({
    fullName: this.fb.control(''),   // ← no validators
    email: ['', [Validators.required, Validators.email]],
    repeatEmail: ['', [Validators.required]],
    phone: ['', [Validators.pattern(/^\+?\d[\d\s\-()]{5,}$/)]],
  }, { validators: this.emailMatchValidator });

  ngOnInit(): void {
    this.loading = true;

    this.registrationService.readEmails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const emails = Array.isArray(response?.data) ? response.data : [];
          this.existingEmailsSet = new Set(
            emails.map((e: string) => (e ?? '').trim().toLowerCase())
          );
        },
        error: (err) => {
          console.error('Error loading registration emails', err);
          this.existingEmailsSet = new Set(); // fallback: no duplicates detected
        },
        complete: () => {
          this.loading = false;

          // now that we have the set, watch the email field
          this.form.controls.email.valueChanges
            .pipe(
              debounceTime(200),
              distinctUntilChanged(),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((email: string) => {
              const val = (email ?? '').trim().toLowerCase();
              this.emailExists = !!val && this.existingEmailsSet.has(val);
            });
        }
      });

    this.form.controls.email.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((email: string) => {
        const val = (email ?? '').trim().toLowerCase();
        this.emailExists = !!val && this.existingEmailsSet.has(val);
      });

  }


  /** Optional, but keep it typed */
  //get f(): ContactForm['controls'] { return this.form.controls; }
  get f() { return this.group.controls as any; }
}