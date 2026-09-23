import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfuserDialog } from './selfuser-dialog';

describe('SelfuserDialog', () => {
  let component: SelfuserDialog;
  let fixture: ComponentFixture<SelfuserDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelfuserDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelfuserDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
