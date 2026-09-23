import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubPanel } from './club-panel';

describe('ClubPanel', () => {
  let component: ClubPanel;
  let fixture: ComponentFixture<ClubPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
