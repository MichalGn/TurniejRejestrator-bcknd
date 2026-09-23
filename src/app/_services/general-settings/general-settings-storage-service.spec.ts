import { TestBed } from '@angular/core/testing';

import { GeneralSettingsStorageService } from './general-settings-storage-service';

describe('GeneralSettingsStorageService', () => {
  let service: GeneralSettingsStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeneralSettingsStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
