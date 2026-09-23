import { TestBed } from '@angular/core/testing';

import { Md5 } from './md5';

describe('Md5', () => {
  let service: Md5;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Md5);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
