import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl + 'users/';
const headers = new HttpHeaders().set('content-type', 'application/json');
const httpOptions = {
  headers: headers,
};

export interface UserData {
  id: number | undefined;
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  admin: boolean;
  active: boolean;
}

export interface CreateUserData {
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  admin: boolean;
}

export interface UpdateUserData {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  password: string | null;
  admin: boolean;
  active: boolean;
}

export interface SelfUpdateUserData {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  updateSelfuser(selfuser: SelfUpdateUserData): Observable<any> {
    return this.http.put(`${API}\selfuser`, selfuser, httpOptions);
  }

  findUsernames(): Observable<any> {
    return this.http.get(`${API}usernames`, httpOptions);
  }

  findAll(activeOnly?: boolean): Observable<any> {
    const options =
      activeOnly !== undefined
        ? {
          ...httpOptions,
          params: new HttpParams().set('activeOnly', String(activeOnly)),
        }
        : httpOptions;

    return this.http.get(`${API}`, options);
  }

  saveUser(user: CreateUserData): Observable<any> {
    return this.http.post(`${API}`, user, httpOptions);
  }

  updateUser(user: UpdateUserData): Observable<any> {
    return this.http.put(`${API}`, user, httpOptions);
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${API}${id}`, httpOptions);
  }


  /*  
      removeAll(): Observable<unknown> {
        return this.http.delete(`${API}deleteAll`, httpOptions);
      }
    
      createFromImport(payload: any[]): Observable<unknown> {
        return this.http.put(`${API}importFromJsonFile`, payload, httpOptions);
      }
        */
}
