import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenStorageService } from './token-storage';

interface ApiResponse {
  data: string;
  accessToken?: string;
  newAccessToken?: string;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`Request is on its way to ${req.url}`);
  const tokenStorageService = inject(TokenStorageService);
  const token = tokenStorageService.getToken();
  const router = inject(Router);

  if (token) {
    const authReq = req.clone({
      //1.clone request
      headers: req.headers.set('Authorization', `${token}`),
    });
    req = authReq;
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.body && ((event.body as ApiResponse).accessToken || (event.body as ApiResponse).newAccessToken)) {
        const accessToken = (event.body as ApiResponse).accessToken;
        const newAccessToken = (event.body as ApiResponse).newAccessToken;
        if (newAccessToken) {
          console.log("zapisuję nowy token....")
          tokenStorageService.saveToken(newAccessToken);
        }
      }
    }),
    catchError(error => {
      if (error.status === 401) {
        tokenStorageService.signOut();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );

};
