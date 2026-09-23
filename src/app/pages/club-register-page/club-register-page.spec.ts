import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubRegisterPage } from './club-register-page';

describe('ClubRegisterPage', () => {
  let component: ClubRegisterPage;
  let fixture: ComponentFixture<ClubRegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubRegisterPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
