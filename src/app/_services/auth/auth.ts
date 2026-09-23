import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


const AUTH_API = environment.apiUrl + 'auth/';

const headers = new HttpHeaders()
.set('content-type', 'application/json')
//.set('Access-Control-Allow-Origin', '*')
;

const x_headers = new HttpHeaders({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'X-Requested-With,content-type',
  'Access-Control-Allow-Credentials': 'true'
});

const httpOptions = {
  headers: headers,
};


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  http = inject(HttpClient);

  // constructor(
  //   private http: HttpClient,
  //   //private router: Router,
  // ) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(AUTH_API + 'signin', { username, password }, httpOptions);
  }
}
