import { ChangeDetectorRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private authTokenSubject = new BehaviorSubject<string | null>(this.getToken());
  authToken$ = this.authTokenSubject.asObservable();

  private userSubject = new BehaviorSubject<any>(this.getUser());
  user$ = this.userSubject.asObservable();

  signOut(): void {
    sessionStorage.clear();
    this.authTokenSubject.next(null);
    this.userSubject.next(null);
  }

  public saveToken(token: string): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.setItem(TOKEN_KEY, token);
    this.authTokenSubject.next(token);
  }

  public getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any): void {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  public updateUser(username: string, firstname: string, lastname: string): void {
    const current = this.getUser() || {};
    const updated = {
      ...current,
      data: {
        ...(current.data || {}),
        username,
        firstname,
        lastname,
      },
    };

    // Persist + notify subscribers
    sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.userSubject.next(updated);
  }

  public getUser(): any {
    const user = sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return {};
  }

  public getUserId(): number {
    return this.getUser().data.id;
  }

}
