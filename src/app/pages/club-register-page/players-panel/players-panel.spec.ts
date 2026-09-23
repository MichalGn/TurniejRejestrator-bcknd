import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayersPanel } from './players-panel';

describe('PlayersPanel', () => {
  let component: PlayersPanel;
  let fixture: ComponentFixture<PlayersPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayersPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayersPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
