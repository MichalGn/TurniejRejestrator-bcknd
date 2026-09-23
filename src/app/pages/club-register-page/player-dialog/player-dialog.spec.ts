import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerDialog } from './player-dialog';

describe('PlayerDialog', () => {
  let component: PlayerDialog;
  let fixture: ComponentFixture<PlayerDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
