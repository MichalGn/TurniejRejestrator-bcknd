import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachesPanel } from './coaches-panel';

describe('CoachesPanel', () => {
  let component: CoachesPanel;
  let fixture: ComponentFixture<CoachesPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachesPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachesPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
