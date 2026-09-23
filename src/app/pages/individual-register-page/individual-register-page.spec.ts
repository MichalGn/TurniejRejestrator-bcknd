import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualRegisterPage } from './individual-register-page';

describe('IndividualRegisterPage', () => {
  let component: IndividualRegisterPage;
  let fixture: ComponentFixture<IndividualRegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualRegisterPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndividualRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
