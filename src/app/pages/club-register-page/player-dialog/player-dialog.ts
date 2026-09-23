import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AccomodationAndMeal } from '../../../shared/accomodation-and-meal/accomodation-and-meal';
import { Category, Games, Gender, PlayerData, RegistrationService } from '../../../_services/shared/registration/registration-service';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { CommonModule, CurrencyPipe } from '@angular/common';
import '@angular/common/locales/global/pl';
import { PriceService } from '../../../_services/shared/price/price-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-player-dialog',
  imports: [ CommonModule, FormsModule,
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
    CurrencyPipe],
  templateUrl: './player-dialog.html',
  styleUrl: './player-dialog.scss'
})
export class PlayerDialog implements OnInit {
readonly dialogRef = inject(MatDialogRef<PlayerDialog>);
  readonly data = inject<PlayerData>(MAT_DIALOG_DATA);
  readonly service = inject(RegistrationService);
  readonly snackbar = inject(SnackbarService);
  private readonly priceService = inject(PriceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly edit = (this.data as any).edit;
  readonly familyMode = !!(this.data as any).familyMode;
  readonly title = this.edit ? 'Edytuj zawodnika' : 'Dodaj zawodnika';
  readonly buttonDesc = this.edit ? 'Zmień' : 'Zapisz';

  firstname: string = this.data.firstname;
  lastname: string = this.data.lastname;
  birthYear: number = this.data.birthYear;
  gender: Gender = this.data.gender;
  category: Category = this.data.category;
  games: Games = this.data.games;
  loading: boolean = false;
  totalPrice = 0;
  accGroup: FormGroup;

  maxYear = new Date().getFullYear();

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
    this.birthYear = this.data?.birthYear ?? this.birthYear ?? '';
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

    this.applyCategoryRules(this.category);

    this.accGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalcPrice());

    this.priceService.loaded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalcPrice());

    this.recalcPrice();
  }


  onCategoryChange(category: Category): void {
    this.category = category;
    this.applyCategoryRules(category);
    this.recalcPrice();
  }

  private applyCategoryRules(category: Category): void {
    const dinnerSatControl = this.accGroup.get('dinnerSat');

    if (category === 'ZAK') {
      this.games = '1g';
      dinnerSatControl?.enable({ emitEvent: false });
      dinnerSatControl?.setValue(false, { emitEvent: false });
    } else {
      dinnerSatControl?.setValue(true, { emitEvent: false });
      dinnerSatControl?.disable({ emitEvent: false });
    }
  }

  onGamesChange(games: Games): void {
    this.games = games;
    this.recalcPrice();
  }

  private recalcPrice(): void {
    const acc = this.accGroup.getRawValue();
    this.totalPrice = this.priceService.calculateTotalPlayer({
      category: this.category,
      games: this.games,
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

    const player: PlayerData = {
      id: undefined,

      firstname: this.firstname,
      lastname: this.lastname,
      birthYear: this.birthYear,
      gender: this.gender,
      category: this.category,
      games: this.games,

      supperFri: acc.supperFri,
      nightFriSat: acc.nightFriSat,
      dinnerSat: acc.dinnerSat,

      supperSat: acc.supperSat,
      nightSatSun: acc.nightSatSun,
      dinnerSun: acc.dinnerSun,
    };
    this.dialogRef.close(player);
  }

  onEditClick(): void {
  const acc = this.accGroup.getRawValue();

  const player: PlayerData = {
    // keep the original id (or undefined if new)
    id: this.data?.id,

    // editable fields
    firstname: this.firstname,
    lastname: this.lastname,
    birthYear: this.birthYear,
    gender: this.gender,
    category: this.category,
    games: this.games,

    // toggles from the reactive group
    supperFri:  acc.supperFri,
    nightFriSat: acc.nightFriSat,
    dinnerSat:  acc.dinnerSat,
    supperSat:  acc.supperSat,
    nightSatSun: acc.nightSatSun,
    dinnerSun:  acc.dinnerSun,
  };

  this.dialogRef.close(player);
}

  onChange(username: string | undefined): void {
    console.log('Coach changed to:', username);
    //this.usernameExists = !!username && this.existingUsernames.includes(username);
  }
}
