import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegistrationStatus } from '../../../pages/admin/registrations/registration-list/registration-list';

const API = environment.apiUrl + 'register';
const httpOptions = { headers: new HttpHeaders().set('content-type', 'application/json') };

export interface RegistrationStatusCounts {
  unverifiedCnt: number;
  verifiedCnt: number;
  removedCnt: number;
  allCnt: number;
  coachesCnt: number;
  playersCnt: number;
}

/** --- existing types left as-is --- */
export type Gender = 'm' | 'f' | 's' | null;
export type Category = 'KT' | 'GP' | 'ZAK' | null;
export type Games = '1g' | '2g' | null;

export interface PersonData {
  id: number | undefined;
  firstname: string;
  lastname: string;
  gender: Gender;
  supperFri: boolean;
  nightFriSat: boolean;
  dinnerSat: boolean | undefined;
  supperSat: boolean;
  nightSatSun: boolean;
  dinnerSun: boolean;
  fee?: number;
}

export interface PlayerData extends PersonData {
  category: Category;
  birthYear: number;
  games: Games;
}

export interface IndividualRegisterData extends PersonData {
  uuid?: string;
  birthYear: number | null;
  category: Category;
  games: Games;
  city: string;
  email: string;
  repeatEmail: string;
  comment: string | null;
  price: number;
}

export interface ClubInfo {
  name: string;
  nip: string;
  streetNo: string;
  zip_code: string;
  city: string;
}

export interface ContactInfo {
  fullName?: string;
  email: string;
  repeatEmail: string;
  phone?: string;
}

export interface ClubRegisterPayload {
  club: ClubInfo;
  coaches: PersonData[];
  players: PlayerData[];
  contact: ContactInfo;
  comment?: string;
  totals: {
    coachesTotalPrice: number;
    playersTotalPrice: number;
    grandTotal: number;
  };
}

export interface RegistrationSummary {
  registrationId: number;
  fullName: string;
  email?: string;
  clubName?: string;
  createdAt: string;
  status: RegistrationStatus;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private http = inject(HttpClient);

  individualRegister(payload: IndividualRegisterData): Observable<unknown> {
    return this.http.post(`${API}/individual`, payload, httpOptions);
  }

  findIndividualByUuid(uuid: string): Observable<IndividualRegisterData> {
    return this.http.get<IndividualRegisterData>(`${API}/individual/${uuid}`, httpOptions);
  }

  updateIndividualByUuid(uuid: string, payload: IndividualRegisterData): Observable<unknown> {
    return this.http.put(`${API}/individual/${uuid}`, payload, httpOptions);
  }

  removeIndividualByUuid(uuid: string): Observable<unknown> {
    return this.http.delete(`${API}/individual/${uuid}`, httpOptions);
  }

  submitClubRegistration(payload: ClubRegisterPayload): Observable<unknown> {
    return this.http.post(`${API}/club`, payload, httpOptions);
  }

  findClubByUuid(uuid: string): Observable<ClubRegisterPayload> {
    return this.http.get<ClubRegisterPayload>(`${API}/club/${uuid}`, httpOptions);
  }

  updateClubByUuid(uuid: string, payload: ClubRegisterPayload): Observable<unknown> {
    return this.http.put(`${API}/club/${uuid}`, payload, httpOptions);
  }

  removeClubByUuid(uuid: string): Observable<unknown> {
    return this.http.delete(`${API}/club/${uuid}`, httpOptions);
  }

  submitFamilyRegistration(payload: ClubRegisterPayload): Observable<unknown> {
    return this.http.post(`${API}/family`, payload, httpOptions);
  }

  findFamilyByUuid(uuid: string): Observable<ClubRegisterPayload> {
    return this.http.get<ClubRegisterPayload>(`${API}/family/${uuid}`, httpOptions);
  }

  updateFamilyByUuid(uuid: string, payload: ClubRegisterPayload): Observable<unknown> {
    return this.http.put(`${API}/family/${uuid}`, payload, httpOptions);
  }

  removeFamilyByUuid(uuid: string): Observable<unknown> {
    return this.http.delete(`${API}/family/${uuid}`, httpOptions);
  }

  readEmails(): Observable<unknown> {
    return this.http.get(`${API}/emails`, httpOptions);
  }

  findListByStatus(status: RegistrationStatus): Observable<RegistrationSummary[]> {
    const params = new HttpParams().set('status', status);
    //return this.http.get<RegistrationSummary[]>(`${API}/registers`, { params });
    return this.http.get<RegistrationSummary[]>(`${API}`, { params });
  }

  updateStatus(id: number, status: RegistrationStatus): Observable<RegistrationSummary> {
    const params = new HttpParams().set('status', status);
    return this.http.put<RegistrationSummary>(`${API}/${id}`, null, {
      params,
      headers: httpOptions.headers,
    });
  }

  findById(registrationId: number): Observable<RegistrationSummary> {
    return this.http.get<RegistrationSummary>(`${API}/${registrationId}`, httpOptions);
  }

  countByStatuses(): Observable<RegistrationStatusCounts> {
    return this.http.get<RegistrationStatusCounts>(`${API}/counts`, httpOptions);
  }

  readAll(): Observable<unknown> {
    return this.http.get(`${API}/all`, httpOptions);
  }

  readCoaches(): Observable<unknown> {
    return this.http.get(`${API}/coaches`, httpOptions);
  }

  readPlayers(): Observable<unknown> {
    return this.http.get(`${API}/players`, httpOptions);
  }

  deleteAll(): Observable<any> {
    return this.http.delete(`${API}/all`, httpOptions);
  }

}
