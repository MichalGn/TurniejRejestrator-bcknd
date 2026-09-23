import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllList } from './all-list';

describe('AllList', () => {
  let component: AllList;
  let fixture: ComponentFixture<AllList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
