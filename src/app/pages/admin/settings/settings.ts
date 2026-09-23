import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InputDialog } from '../../../shared/dialogs/input-dialog/input-dialog';
import { MatDialog } from '@angular/material/dialog';
import { GeneralSettingData, GeneralSettingsService } from '../../../_services/general-settings/general-settings-service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatSlideToggleModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings {

  settingsDef = [
    { acronym: 'title', label: 'Tytuł:', value: '' },
    { acronym: 'registrationClosed', label: 'Rejestracja zamknięta:', value: 'false', inputType: 'boolean' },

    
    { acronym: 'zak_1g_0n', label: 'Opłata festiwalowa: Żak - 1 gra - 0 noclegów [PLN]:', value: '' },
    { acronym: 'zak_1g_1n', label: 'Opłata festiwalowa: Żak - 1 gra - 1 nocleg [PLN]:', value: '' },
    { acronym: 'zak_1g_2n', label: 'Opłata festiwalowa: Żak - 1 gra - 2 noclegi [PLN]:', value: '' },
    
    { acronym: 'kt_1g_0n', label: 'Opłata festiwalowa: KT - 1 gra - 0 noclegów [PLN]:', value: '' },
    { acronym: 'kt_1g_1n', label: 'Opłata festiwalowa: KT - 1 gra - 1 nocleg [PLN]:', value: '' },
    { acronym: 'kt_1g_2n', label: 'Opłata festiwalowa: KT - 1 gra - 2 noclegi [PLN]:', value: '' },

    { acronym: 'kt_2g_0n', label: 'Opłata festiwalowa: KT - 2 gry - 0 noclegów [PLN]:', value: '' },
    { acronym: 'kt_2g_1n', label: 'Opłata festiwalowa: KT - 2 gry - 1 nocleg [PLN]:', value: '' },
    { acronym: 'kt_2g_2n', label: 'Opłata festiwalowa: KT - 2 gry - 2 noclegi [PLN]:', value: '' },

    { acronym: 'gp_1g_0n', label: 'Opłata festiwalowa: GP - 1 gra - 0 noclegów [PLN]:', value: '' },
    { acronym: 'gp_1g_1n', label: 'Opłata festiwalowa: GP - 1 gra - 1 nocleg [PLN]:', value: '' },
    { acronym: 'gp_1g_2n', label: 'Opłata festiwalowa: GP - 1 gra - 2 noclegi [PLN]:', value: '' },

    { acronym: 'gp_2g_0n', label: 'Opłata festiwalowa: GP - 2 gry - 0 noclegów [PLN]:', value: '' },
    { acronym: 'gp_2g_1n', label: 'Opłata festiwalowa: GP - 2 gry - 1 nocleg [PLN]:', value: '' },
    { acronym: 'gp_2g_2n', label: 'Opłata festiwalowa: GP - 2 gry - 2 noclegi [PLN]:', value: '' },

    { acronym: 'tr_1n', label: 'Trener - 1 nocleg [PLN]:', value: '' },
    { acronym: 'tr_2n', label: 'Trener - 2 noclegi [PLN]:', value: '' },

    { acronym: 'tr_1n_s', label: 'Trener - 1 nocleg - pokój jednoosobowy [PLN]:', value: '' },
    { acronym: 'tr_2n_s', label: 'Trener - 2 noclegi - pokój jednoosobowy [PLN]:', value: '' },

    { acronym: 'dinner', label: 'Cena za obiad [PLN]:', value: '' },
    { acronym: 'supper', label: 'Cena za kolację [PLN]:', value: '' },

    { acronym: 'sendEmails', label: 'Wysyłanie maili z potwierdzeniem:', value: 'tak' },
    { acronym: 'ccEmails', label: 'Kopia maili do:', value: '' },

    { acronym: 'bill_owner_line_1', label: 'Rachunek - wystawca, linia 1', value: '' },
    { acronym: 'bill_owner_line_2', label: 'Rachunek - wystawca, linia 2', value: '' },
    { acronym: 'bill_owner_line_3', label: 'Rachunek - wystawca, linia 3', value: '' },
    { acronym: 'bill_owner_line_4', label: 'Rachunek - wystawca, linia 4', value: '' },
    { acronym: 'bill_owner_line_5', label: 'Rachunek - wystawca, linia 5', value: '' },
    { acronym: 'bill_number_prefix', label: 'Rachunek - prefix numeru', value: '' },
    { acronym: 'bill_number_suffix', label: 'Rachunek - suffix numeru', value: '' },
    { acronym: 'bill_default_payment_desc_line_1', label: 'Rachunek - opis usługi, linia 1', value: '' },
    { acronym: 'bill_default_payment_desc_line_2', label: 'Rachunek - opis usługi, linia 2', value: '' },
    { acronym: 'bill_default_payment_desc_line_3', label: 'Rachunek - opis usługi, linia 3', value: '' },
    { acronym: 'bill_account_number', label: 'Rachunek - numer konta bankowego', value: '' },
    { acronym: 'bill_account_transfer', label: 'Rachunek - opis treści przelewu', value: '' },

    { acronym: 'coupon_title', label: 'Kupon - Tytuł:', value: '' },
    { acronym: 'coupon_date_friday', label: 'Kupon - data piątek:', value: '', inputType: 'date' },
    { acronym: 'coupon_date_saturday', label: 'Kupon - data sobota:', value: '', inputType: 'date' },
    { acronym: 'coupon_date_sunday', label: 'Kupon - data niedziela:', value: '', inputType: 'date' },
  ];

  dialog = inject(MatDialog);
  service = inject(GeneralSettingsService);
  loading = false;

  ngOnInit(): void {
    this.findAll();
  }

  findAll(): void {
    this.loading = true;
    this.service.findAll().subscribe({
      next: (res: GeneralSettingData[] | { data: GeneralSettingData[] }) => {
        const rows: GeneralSettingData[] = Array.isArray(res) ? res : (res?.data ?? []);
        console.log('findAll → rows:', rows);

        // key1 -> value1 (coerce to string for consistency)
        const byKey = new Map<string, string>(
          rows.map(r => [r.key1, r.value1 == null ? '' : String(r.value1)])
        );

        // fill values into settingsDef by acronym
        this.settingsDef = this.settingsDef.map(item => ({
          ...item,
          value: byKey.get(item.acronym) ?? item.value ?? ''
        }));

      },
      error: (err: any) => console.error('findAll failed', err),
      complete:() => this.loading = false
    });
  }

  isBooleanTrue(value: unknown): boolean {
    const normalized = String(value ?? '').trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 'tak', 't'].includes(normalized);
  }

  updateBoolean(item: any, checked: boolean): void {
    this.service.update({ key1: item.acronym, value1: checked ? 'true' : 'false' }).subscribe({
      next: () => this.findAll(),
      error: (err: any) => console.error('Boolean setting update failed', err)
    });
  }

  edit(item: any): void {
    console.log("item:", item)
    const dialogRef = this.dialog.open(InputDialog, {
      data: {
        title: item.label,
        defaultValue: item.value,
        inputType: item.inputType ?? 'text'
      },
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      //if (result) {
        this.service.update({ key1: item.acronym, value1: result }).subscribe(() => {
          console.log('Item updated:', result);
          this.findAll();
        });
      //}
    });
  }
}
