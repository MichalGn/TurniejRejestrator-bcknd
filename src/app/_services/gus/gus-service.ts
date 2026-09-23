import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GusCompany {
  nip: string;
  name: string;
  streetNo: string;
  zipCode: string;
  city: string;
}

@Injectable({ providedIn: 'root' })
export class GusService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl + 'gus';

  findByNip(nip: string): Observable<GusCompany> {
    const normalizedNip = nip.replace(/\D/g, '');
    return this.http.get<GusCompany>(`${this.api}/by-nip/${normalizedNip}`);
  }
}
