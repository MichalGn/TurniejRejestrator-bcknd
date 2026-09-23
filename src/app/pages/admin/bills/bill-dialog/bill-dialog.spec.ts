import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillDialog } from './bill-dialog';

describe('BillDialog', () => {
  let component: BillDialog;
  let fixture: ComponentFixture<BillDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
