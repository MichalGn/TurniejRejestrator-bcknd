import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const API = environment.apiUrl + 'general-settings/';
const headers = new HttpHeaders().set('content-type', 'application/json');
const httpOptions = {
  headers: headers,
};

export interface GeneralSettingData {
  key1: string;
  value1: string | number | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GeneralSettingsService {
  private http = inject(HttpClient);

  update(item: GeneralSettingData): Observable<any> {
    return this.http.post(`${API}`, item, httpOptions);
  }

  findAll(): Observable<any> {
    return this.http.get(`${API}`, httpOptions);
  }

  findByKey1(key1: string): Observable<any> {
    const params = new HttpParams().set('key1', key1);
    return this.http.get(`${API}findByKey1`, { ...httpOptions, params });
  }

  isRegistrationClosed(): Observable<boolean> {
    return this.findByKey1('registrationClosed').pipe(
      map((res: any) => {
        const raw = res?.data ?? res?.value ?? res ?? '';
        const value = String(raw).trim().toLowerCase();
        return ['true', '1', 'yes', 'y', 'tak', 't'].includes(value);
      }),
      // If the setting does not exist yet (or cannot be read), keep registration open.
      catchError(() => of(false))
    );
  }

}
