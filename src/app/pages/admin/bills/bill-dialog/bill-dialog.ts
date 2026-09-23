import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BillService, CreateOrUpdateBillDataReq } from '../../../../_services/bill/bill-service';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';

import { GeneralSettingsStorageService } from '../../../../_services/general-settings/general-settings-storage-service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GusCompany, GusService } from '../../../../_services/gus/gus-service';
import { RegistrationService, RegistrationSummary } from '../../../../_services/shared/registration/registration-service';
import { finalize, Subscription, take } from 'rxjs';
import { TokenStorageService } from '../../../../_services/auth/token-storage';
import { generateBillPdf } from '../../../../_services/bill/bill-pdf-generator';

type PaymentMethod = 'CASH' | 'TRANSFER_14' | 'TRANSFER_30';

export interface BillDialogParams {
  registrationId?: number | null;
  billId?: number | null;
}

@Component({
  selector: 'app-bill-dialog',
  imports: [
    CommonModule,
    ///FormsModule,
    ReactiveFormsModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './bill-dialog.html',
  styleUrl: './bill-dialog.scss'
})
export class BillDialog {
  readonly dialogRef = inject(MatDialogRef<BillDialog>);
  readonly params = inject<BillDialogParams>(MAT_DIALOG_DATA);

  // easy access
  readonly registrationId = this.params?.registrationId ?? null;
  readonly billId = this.params?.billId ?? undefined;

  //  readonly dialogRef = inject(MatDialogRef<BillDialog>);
  //  readonly data = inject<BillData>(MAT_DIALOG_DATA);
  private store = inject(GeneralSettingsStorageService);
  readonly registrationService = inject(RegistrationService);
  readonly tokenStorageService = inject(TokenStorageService);
  readonly service = inject(BillService);
  readonly snackbar = inject(SnackbarService);
  readonly gusService = inject(GusService);

  // Mode / UI texts
  readonly edit = this.billId != undefined; //!!this.data?.billnumber; // adjust condition to your model
  readonly title = this.edit ? 'Edytuj rachunek' : 'Dodaj rachunek';
  readonly buttonDesc = this.edit ? 'Zmień' : 'Dodaj';
  private sumSub?: Subscription;

  generalSettingsStorage = inject(GeneralSettingsStorageService).getBillSettingsSnapshot();

  // Bill fields (init from injected data)
  purchaser: string = '';//this.data?.purchaser ?? '';
  nip: string = '';
  registrationSummary: RegistrationSummary | null = null;
  //cashAmount: number = 0;//this.data?.cashAmount ?? 0;
  //transferAmount: number = 0;//this.data?.transferAmount ?? 0;
  //comment: string = this.data?.comment ?? '';

  private nf = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  loading = false;
  gusLoading = false;
  billFullNumber = '';

  form = new FormGroup({
    purchaser: new FormControl<string>(this.purchaser, { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    nip: new FormControl<string>(this.nip, { validators: [Validators.pattern(/^\d{0,10}$/)] }),
    autoNumber: new FormControl<boolean>(true, { nonNullable: true }),
    manualNumber: new FormControl<string>('', [
      Validators.maxLength(4),
      Validators.pattern(/^\d+$/),  // ← only digits 0-9
    ]),

    billNumber: new FormControl<number | null>(null),
    billNumberSuffix: new FormControl<string>(this.store.getBillSettingsSnapshot()?.bill_number_suffix ?? ''),

    billPaymentDescLine1: new FormControl<string>(this.store.getBillSettingsSnapshot()?.bill_default_payment_desc_line_1 ?? ''),
    billPaymentValue1: new FormControl<number | null>(null),

    billPaymentDescLine2: new FormControl<string>(this.store.getBillSettingsSnapshot()?.bill_default_payment_desc_line_2 ?? ''),
    billPaymentValue2: new FormControl<number | null>(null),

    billPaymentDescLine3: new FormControl<string>(this.store.getBillSettingsSnapshot()?.bill_default_payment_desc_line_3 ?? ''),
    billPaymentValue3: new FormControl<number | null>(null),

    billTotalValue: new FormControl<string>('0,00'),
    // OPTIONAL fields
    email: new FormControl<string>('', {
      validators: [Validators.email, Validators.maxLength(254)],
      updateOn: 'blur', // validate email on blur, not every keystroke
    }),
    comment: new FormControl<string>('', {
      validators: [Validators.maxLength(500)],
    }),

    suffixPdfName: new FormControl<string>('', [Validators.maxLength(16)]),
    paymentMethod: new FormControl<PaymentMethod>('CASH', { nonNullable: true }),


  });


  get canLoadFromGus(): boolean {
    return this.normalizedNip.length === 10 && !this.gusLoading;
  }

  loadFromGus(): void {
    const nip = this.normalizedNip;
    if (nip.length !== 10) {
      this.form.get('nip')?.markAsTouched();
      this.snackbar.showWarning('Wpisz 10-cyfrowy NIP.');
      return;
    }

    this.gusLoading = true;
    this.gusService.findByNip(nip)
      .pipe(finalize(() => this.gusLoading = false), take(1))
      .subscribe({
        next: company => {
          this.form.patchValue({
            nip: company.nip,
            purchaser: this.buildPurchaserFromGus(company),
            suffixPdfName: company.city || this.form.get('suffixPdfName')?.value || ''
          });
          this.snackbar.showSuccess('Dane nabywcy pobrano z GUS.');
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
    this.form.get('nip')?.setValue(digitsOnly, { emitEvent: false });
    this.form.get('nip')?.updateValueAndValidity({ emitEvent: false });
  }

  private get normalizedNip(): string {
    return String(this.form.get('nip')?.value ?? '').replace(/\D/g, '');
  }

  private buildPurchaserFromGus(company: GusCompany): string {
    const address = [company.streetNo, [company.zipCode, company.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');
    return [company.name, address].filter(Boolean).join(', ');
  }

  ngOnInit(): void {
    this.setupSumWatcher(); 
    if (this.billId == null) {
      this.initAddNewBill();
    } else {
      this.initEditBill();
    }
  }
  
  ngOnDestroy(): void {
    this.sumSub?.unsubscribe();
  }

  initAddNewBill() {
    this.service.findMaxBillNumber().subscribe({
      next: (data: any) => {
        this.form.get('billNumber')!.setValue(data.maxBillNumber + 1);
      },
      error: e => {
        this.snackbar.showError('Błąd w odczycie rachunków', e);
      }
    })

    if (this.registrationId !== null) {
      this.loading = false;
      this.registrationService.findById(this.registrationId)
        .pipe(finalize(() => this.loading = false), take(1))
        .subscribe({
          next: (data: any) => {
            this.registrationSummary = data.item;

            const purchaserText = this.buildPurchaserText(data.item);
            this.purchaser = purchaserText;
            this.form.get('nip')!.setValue(data.item.nip);
            // ustaw wartość w formularzu po otrzymaniu danych
            this.form.get('purchaser')!.setValue(purchaserText);
            this.form.get('billPaymentValue1')!.setValue(data.item.totalPrice);
            this.form.get('email')!.setValue(data.item.email);
            this.form.get('suffixPdfName')!.setValue(data.item.city);
            this.recalcSumOnce();
          },
          error: e => {
            this.snackbar.showError('Błąd w odczycie rejestracji', e);
          }
        });
    }

    const val = (name: string) => this.parseNum(this.form.get(name)?.value) ?? 0;

    // this.form.valueChanges.subscribe(() => {
    //   const val = (name: string) => this.parseNum(this.form.get(name)?.value) ?? 0;
    //   const sum = val('billPaymentValue1') + val('billPaymentValue2') + val('billPaymentValue3');
    //   this.form.get('billTotalValue')?.setValue(this.nf.format(Math.round(sum * 100) / 100), { emitEvent: false });
    // });

    // Optional: if defaults exist in your storage, pre-format them right away:
    const snap = this.store.getBillSettingsSnapshot();
    if (snap) {
      this.form.patchValue({
        billNumberSuffix: snap.bill_number_suffix,
        billPaymentDescLine1: snap.bill_default_payment_desc_line_1 ?? '',
        billPaymentDescLine2: snap.bill_default_payment_desc_line_2 ?? '',
        billPaymentDescLine3: snap.bill_default_payment_desc_line_3 ?? '',
      });
    }
  }

  initEditBill() {
    this.loading = false;
    if (this.billId) {
      this.service.findById(this.billId)
        .pipe(finalize(() => this.loading = false), take(1))
        .subscribe({
          next: (data: any) => {
            this.billFullNumber = data.data.billFullNumber;
            this.form.get('purchaser')!.setValue(data.data.purchaser);
            this.form.get('nip')!.setValue(data.data.nip);
            //this.form.get('autoNumber')?.disable({ emitEvent: true });
            this.form.get('autoNumber')?.disable({ emitEvent: false });
            // autoNumber: new FormControl<boolean>(
            //   { value: true, disabled: this.billId != null },  // <- key line
            //   { nonNullable: true }
            // ),

            this.form.get('billPaymentDescLine1')!.setValue(data.data.billPaymentDescLine1);
            this.form.get('billPaymentValue1')!.setValue(data.data.billPaymentValueLine1);
            this.form.get('billPaymentDescLine2')!.setValue(data.data.billPaymentDescLine2);
            this.form.get('billPaymentValue2')!.setValue(data.data.billPaymentValueLine2);
            this.form.get('billPaymentDescLine3')!.setValue(data.data.billPaymentDescLine3);
            this.form.get('billPaymentValue3')!.setValue(data.data.billPaymentValueLine3);
            if (data.data.billTotalValueCash != null)
              this.form.get('billTotalValue')!.setValue(data.data.billTotalValueCash);
            else if (data.data.billTotalValueTransfer != null)
              this.form.get('billTotalValue')!.setValue(data.data.billTotalValueTransfer);
            this.form.get('paymentMethod')!.setValue(data.data.paymentMethod);
            this.form.get('email')!.setValue(data.data.email);
            this.form.get('suffixPdfName')!.setValue(data.data.suffixPdfName);
            this.form.get('comment')!.setValue(data.data.comment);
            this.recalcSumOnce();
          },
          error: e => {
            this.snackbar.showError('Błąd w odczycie rejestracji', e);
          }
        });
    }
  }

private setupSumWatcher() {
    const val = (name: string) => this.parseNum(this.form.get(name)?.value) ?? 0;

    this.sumSub?.unsubscribe();
    this.sumSub = this.form.valueChanges.subscribe(() => {
      const sum = val('billPaymentValue1') + val('billPaymentValue2') + val('billPaymentValue3');
      this.form.get('billTotalValue')?.setValue(
        this.nf.format(Math.round(sum * 100) / 100),
        { emitEvent: false }
      );
    });
  }

  /** Use after patching/setting values programmatically to compute once */
  private recalcSumOnce() {
    const val = (name: string) => this.parseNum(this.form.get(name)?.value) ?? 0;
    const sum = val('billPaymentValue1') + val('billPaymentValue2') + val('billPaymentValue3');
    this.form.get('billTotalValue')?.setValue(
      this.nf.format(Math.round(sum * 100) / 100),
      { emitEvent: false }
    );
  }

  private buildPurchaserText(item: any): string {
    if (!item) return '';
    const parts: string[] = [];
    if (item.clubName) parts.push(item.clubName);

    const addr: string[] = [];
    if (item.streetNo) addr.push(item.streetNo);
    const cityParts: string[] = [];
    if (item.zipCode) cityParts.push(item.zipCode);
    if (item.city) cityParts.push(item.city);
    if (cityParts.length) addr.push(cityParts.join(' '));
    if (addr.length) parts.push(addr.join(' '));

    if (item.nip) parts.push(`NIP: ${item.nip}`);
    return parts.join(', ');
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddClick(): void {
    const v = this.form.get('manualNumber')?.value;
    const manualNumber: number | null = (v == null || v === '') ? null : parseInt(String(v), 10);

    const createBill: CreateOrUpdateBillDataReq = {
      billId: undefined,
      userId: this.tokenStorageService.getUserId(),
      registrationId: this.registrationId,

      purchaser: this.getStr('purchaser'),
      nip: this.getStr('nip'),
      billNumberAuto: this.form.get('autoNumber')?.value ?? true,
      billNumberManPrefix: manualNumber,

      billPaymentDescLine1: this.getStr('billPaymentDescLine1'),
      billPaymentValueLine1: this.getNum('billPaymentValue1'),

      billPaymentDescLine2: this.getStr('billPaymentDescLine2'),
      billPaymentValueLine2: this.getNum('billPaymentValue2'),

      billPaymentDescLine3: this.getStr('billPaymentDescLine3'),
      billPaymentValueLine3: this.getNum('billPaymentValue3'),

      billTotalValue: this.getNum('billTotalValue'),
      paymentMethod: this.getStr('paymentMethod'),

      email: this.getStr('email'),
      suffixPdfName: this.getStr('suffixPdfName'),
      comment: this.getStr('comment'),
    };

    this.service.create(createBill).subscribe({
      next: response => {
        const email = this.getStr('email').trim();
        if (!email) {
          this.snackbar.showSuccess('Rachunek utworzony prawidłowo');
          this.dialogRef.close();
          return;
        }
        this.sendCreatedBillByEmail(response.billId, email);
      },
      error: (err: any) => {
        console.error('Błąd tworzenia rachunku:', err);
        this.snackbar.showError('Błąd w tworzeniu rachunku.');
      }
    });
  }

  private sendCreatedBillByEmail(billId: number, email: string): void {
    this.service.findById(billId).pipe(take(1)).subscribe({
      next: (data: any) => {
        const generated = generateBillPdf(
          data.data,
          this.store.getBillSettingsSnapshot(),
          false
        );
        this.blobToBase64(generated.blob)
          .then(pdfBase64 => {
            this.service.sendBillEmail(billId, email, generated.filename, pdfBase64)
              .pipe(take(1))
              .subscribe({
                next: () => {
                  this.snackbar.showSuccess('Rachunek utworzony i wysłany e-mailem.');
                  this.dialogRef.close();
                },
                error: (err: any) => {
                  console.error('Błąd wysyłania rachunku:', err);
                  this.snackbar.showWarning('Rachunek utworzono, ale nie udało się wysłać e-maila.');
                  this.dialogRef.close();
                }
              });
          })
          .catch(err => {
            console.error('Błąd generowania PDF rachunku:', err);
            this.snackbar.showWarning('Rachunek utworzono, ale nie udało się przygotować PDF-a.');
            this.dialogRef.close();
          });
      },
      error: (err: any) => {
        console.error('Błąd odczytu utworzonego rachunku:', err);
        this.snackbar.showWarning('Rachunek utworzono, ale nie udało się przygotować wiadomości e-mail.');
        this.dialogRef.close();
      }
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result ?? '');
        const commaIndex = value.indexOf(',');
        resolve(commaIndex >= 0 ? value.substring(commaIndex + 1) : value);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  onEditClick(): void {
    console.log("onEditClick")
    const v = this.form.get('manualNumber')?.value;
    const manualNumber: number | null = (v == null || v === '') ? null : parseInt(String(v), 10);

    const updateBill: CreateOrUpdateBillDataReq = {
      billId: this.billId,
      userId: this.tokenStorageService.getUserId(),
      registrationId: this.registrationId,

      purchaser: this.getStr('purchaser'),
      nip: this.getStr('nip'),
      billNumberAuto: this.form.get('autoNumber')?.value ?? true,
      billNumberManPrefix: manualNumber,

      billPaymentDescLine1: this.getStr('billPaymentDescLine1'),
      billPaymentValueLine1: this.getNum('billPaymentValue1'),

      billPaymentDescLine2: this.getStr('billPaymentDescLine2'),
      billPaymentValueLine2: this.getNum('billPaymentValue2'),

      billPaymentDescLine3: this.getStr('billPaymentDescLine3'),
      billPaymentValueLine3: this.getNum('billPaymentValue3'),

      billTotalValue: this.getNum('billTotalValue'),
      paymentMethod: this.getStr('paymentMethod'),

      email: this.getStr('email'),
      suffixPdfName: this.getStr('suffixPdfName'),
      comment: this.getStr('comment'),
    };

    this.service.update(updateBill).subscribe({
      next: () => this.dialogRef.close(),
      error: (err: any) => {
        console.error('Błąd w modyfikacji rachunku:', err);
        this.snackbar.showError('Błąd w modyfikacji rachunku.');
      },
      complete: () => {
        this.snackbar.showSuccess('Rachunek zmodyfikowany prawidłowo');
      }
    });
  }

  // onClubFullnameChange(clubFullname: string): void {
  //   this.purchaser = purchaser;
  // }

  // Accepts "123,45" or "123.45" -> number or null
  private parseNum(s: any): number | null {
    if (s == null || s === '') return null;
    const n = Number(String(s).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  // On focus: show raw number (easy to edit)
  unformat(el: HTMLInputElement) {
    const n = this.parseNum(el.value);
    el.value = n == null ? '' : String(n);
    el.select();
  }

  // On blur: keep form control numeric, show exactly 2 decimals
  format2dec(el: HTMLInputElement, controlName: string) {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;

    const n = this.parseNum(el.value);
    if (n == null) {
      ctrl.setValue(null);      // or setValue(0) if you prefer
      el.value = '';
      return;
    }

    ctrl.setValue(n, { emitEvent: true }); // model stays number
    //el.value = n.toFixed(2);               // display 2 decimals (use .replace('.', ',') for Polish)
    el.value = n.toFixed(2).replace('.', ',');
  }

  get billAutoNumber(): string {
    if (this.billId == null) {
      const n: number | null = this.form.get('billNumber')?.value ?? null;
      //const s: string = this.form.get('billNumberSuffix')?.value || '';
      const suffixRaw = this.form.get('billNumberSuffix')?.value as string | null;
      const s = (suffixRaw ?? '').replace(/^\/+/, '').replace(/\/+$/, ''); // no leading/trailing '/'
      const num = n == null ? '' : String(n).padStart(3, '0'); // 001, 002, ...
      return [num, s].filter(Boolean).join('/');
    } else {
      return this.billFullNumber;
    }
  }

  private getStr(name: string): string {
    const v = this.form.get(name)?.value;
    return v == null ? '' : String(v);
  }
  private getNum(name: string): number {
    const v = this.form.get(name)?.value; // number | string | null | undefined
    if (v == null || v === '') return 0;  // choose your default (0 or throw)
    return typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  }

}
