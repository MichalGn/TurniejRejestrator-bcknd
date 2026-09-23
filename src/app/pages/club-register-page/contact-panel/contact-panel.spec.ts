import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactPanel } from './contact-panel';

describe('ContactPanel', () => {
  let component: ContactPanel;
  let fixture: ComponentFixture<ContactPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
