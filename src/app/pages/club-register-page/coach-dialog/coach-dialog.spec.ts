import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachDialog } from './coach-dialog';

describe('CoachDialog', () => {
  let component: CoachDialog;
  let fixture: ComponentFixture<CoachDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
