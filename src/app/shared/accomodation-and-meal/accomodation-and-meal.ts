import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-accomodation-and-meal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSlideToggleModule],
  templateUrl: './accomodation-and-meal.html',
  styleUrl: './accomodation-and-meal.scss'
})
export class AccomodationAndMeal implements OnInit, OnChanges {
  /** Parent passes its FormGroup here */
  @Input({ required: true }) group!: FormGroup;
  
  /** If true → “Obiad w sobotę” gets checked and disabled */
  @Input() disableDinnerSat = false;
  @Input() hideNights = false;

  ngOnInit() {
    this.applyDinnerSatState();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disableDinnerSat']) this.applyDinnerSatState();
  }

  private applyDinnerSatState() {
    const ctrl = this.group?.get('dinnerSat');
    if (!ctrl) return;
    if (this.disableDinnerSat) {
      ctrl.setValue(true, { emitEvent: false });
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
    }
  }
}
