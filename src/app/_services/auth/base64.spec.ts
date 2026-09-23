import { TestBed } from '@angular/core/testing';

import { Base64 } from './base64';

describe('Base64', () => {
  let service: Base64;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Base64);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
