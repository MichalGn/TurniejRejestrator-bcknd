import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogModule  } from '@angular/material/dialog';
import { MatInputModule } from "@angular/material/input";
import { Md5Service } from '../../../_services/auth/md5';
import { AuthService } from '../../../_services/auth/auth';
import { Base64Service } from '../../../_services/auth/base64';
import { TokenStorageService } from '../../../_services/auth/token-storage';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-dialog',
  imports: [MatDialogContent, MatInputModule, FormsModule, MatDialogModule, MatButtonModule ],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss'
})
export class LoginDialog {
  login: string = '';
  password: string = '';
  isLoading = false;
  hidePass = true;
  private md5Service = inject(Md5Service);
  private base64Service = inject(Base64Service);
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  constructor(public dialogRef: MatDialogRef<LoginDialog>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onLogin(): void {
    this.dialogRef.close({ login: this.login, password: this.password });
     const passMd5 = this.md5Service.createHash(this.password);
    this.isLoading = true;
    this.authService.login(this.login, this.base64Service.encode(passMd5)).subscribe({
      next: data => {
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        this.router.navigate(['/admin']);
      },
      error: e => {
        this.isLoading = false;
        this.snackbar.showError('Błędny użytkownik lub hasło ');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

}
