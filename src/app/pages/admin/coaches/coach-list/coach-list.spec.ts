import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachList } from './coach-list';

describe('CoachList', () => {
  let component: CoachList;
  let fixture: ComponentFixture<CoachList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
