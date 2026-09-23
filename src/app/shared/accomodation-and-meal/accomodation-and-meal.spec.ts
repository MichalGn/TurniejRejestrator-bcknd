import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccomodationAndMeal } from './accomodation-and-meal';

describe('AccomodationAndMeal', () => {
  let component: AccomodationAndMeal;
  let fixture: ComponentFixture<AccomodationAndMeal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccomodationAndMeal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccomodationAndMeal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
