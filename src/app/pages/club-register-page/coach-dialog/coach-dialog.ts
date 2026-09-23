import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatCard } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogModule, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { CommonModule, CurrencyPipe } from '@angular/common';
import '@angular/common/locales/global/pl';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Gender, PersonData, RegistrationService } from '../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { AccomodationAndMeal } from "../../../shared/accomodation-and-meal/accomodation-and-meal";
import { PriceService } from '../../../_services/shared/price/price-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-coach-dialog',
  imports: [CommonModule,
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    AccomodationAndMeal,
    ReactiveFormsModule,
    MatIconModule,
    CurrencyPipe
  ],
  templateUrl: './coach-dialog.html',
  styleUrl: './coach-dialog.scss'
})
export class CoachDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<CoachDialog>);
  readonly data = inject<PersonData>(MAT_DIALOG_DATA);
  readonly service = inject(RegistrationService);
  readonly snackbar = inject(SnackbarService);
  private readonly priceService = inject(PriceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly edit = (this.data as any).edit;
  readonly familyMode = !!(this.data as any).familyMode;
  readonly personLabelTitle = (this.data as any).personLabelTitle ?? 'trenera';
  readonly title = this.edit ? `Edytuj ${this.personLabelTitle}` : `Dodaj ${this.personLabelTitle}`;
  readonly buttonDesc = this.edit ? 'Zmień' : 'Zapisz';

  firstname: string = this.data.firstname;
  lastname: string = this.data.lastname;
  gender: Gender = this.data.gender;
  loading: boolean = false;
  totalPrice = 0;

  accGroup: FormGroup;

  constructor(private fb: FormBuilder) {
    this.accGroup = this.fb.group({
      nightFriSat: [false],
      supperFri: [false],
      dinnerSat: [false],
      nightSatSun: [false],
      supperSat: [false],
      dinnerSun: [false],
    });
  }

  ngOnInit(): void {
    // prefill firstname/lastname if present
    this.firstname = this.data?.firstname ?? this.firstname ?? '';
    this.lastname = this.data?.lastname ?? this.lastname ?? '';
    this.gender = this.data?.gender ?? this.gender ?? null;

    // prefill the reactive group for edit
    this.accGroup.patchValue({
      nightFriSat: !!this.data?.nightFriSat,
      supperFri: !!this.data?.supperFri,
      dinnerSat: !!this.data?.dinnerSat,
      nightSatSun: !!this.data?.nightSatSun,
      supperSat: !!this.data?.supperSat,
      dinnerSun: !!this.data?.dinnerSun,
    });

    this.accGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalcPrice());

    this.priceService.loaded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalcPrice());

    this.recalcPrice();
  }

  onGenderChange(gender: Gender): void {
    this.gender = gender;
    this.recalcPrice();
  }

  private recalcPrice(): void {
    const acc = this.accGroup.getRawValue();
    this.totalPrice = this.priceService.calculateTotalCoach({
      gender: this.gender,
      nights: { friSat: !!acc.nightFriSat, satSun: !!acc.nightSatSun },
      meals: {
        supperFri: !!acc.supperFri,
        dinnerSat: !!acc.dinnerSat,
        supperSat: !!acc.supperSat,
        dinnerSun: !!acc.dinnerSun
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddClick(): void {
    const acc = this.accGroup.getRawValue();
    console.log('Accommodation/meal:', acc);

    const coach: PersonData = {
      id: undefined,

      firstname: this.firstname,
      lastname: this.lastname,
      gender: this.gender,

      supperFri: acc.supperFri,
      nightFriSat: acc.nightFriSat,
      dinnerSat: acc.dinnerSat,

      supperSat: acc.supperSat,
      nightSatSun: acc.nightSatSun,
      dinnerSun: acc.dinnerSun,
    };
    this.dialogRef.close(coach);
  }

  onEditClick(): void {
  const acc = this.accGroup.getRawValue();

  const coach: PersonData = {
    // keep the original id (or undefined if new)
    id: this.data?.id,

    // editable fields
    firstname: this.firstname,
    lastname: this.lastname,
    gender: this.gender,

    // toggles from the reactive group
    supperFri:  acc.supperFri,
    nightFriSat: acc.nightFriSat,
    dinnerSat:  acc.dinnerSat,
    supperSat:  acc.supperSat,
    nightSatSun: acc.nightSatSun,
    dinnerSun:  acc.dinnerSun,
  };

  this.dialogRef.close(coach);
}


  // onChange(username: string | undefined): void {
  //   console.log('Coach changed to:', username);
  //   //this.usernameExists = !!username && this.existingUsernames.includes(username);
  // }
}

