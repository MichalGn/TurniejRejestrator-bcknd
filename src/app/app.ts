import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TokenStorageService } from './_services/auth/token-storage';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ConfirmationDialog } from './shared/dialogs/confirmation-dialog/confirmation-dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoginDialog } from './pages/club-register-page/login-dialog/login-dialog';
import { CommonModule } from '@angular/common';
import { SelfuserDialog } from './shared/dialogs/selfuser-dialog/selfuser-dialog';
import { GeneralSettingsService } from './_services/general-settings/general-settings-service';


@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatIcon,
    MatTooltipModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  //readonly title = signal('TurniejRejstrator-frtnd');
  title = "";

  private tokenStorageService = inject(TokenStorageService);
  private generalSettingsService = inject(GeneralSettingsService);
  private router = inject(Router);
  public dialog = inject(MatDialog);
  public user$ = this.tokenStorageService.user$;
  isAuthenticated = false;

  ngOnInit(): void {
    this.tokenStorageService.authToken$.subscribe(token => {
      this.isAuthenticated = !!token;
    });

    this.generalSettingsService.findByKey1('title').subscribe(data => {
      this.title = data.data;
    });
  }

  onLogin(): void {
    const dialogRef = this.dialog.open(LoginDialog);
  }

  logout(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.restoreFocus = false;
    dialogConfig.data = {
      title: 'Potwierdzenie',
      message: 'Czy na pewno chcesz się wylogować?',
    };
    const dialogRef = this.dialog.open(ConfirmationDialog, dialogConfig);

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.tokenStorageService.signOut();
        this.router.navigate(['']);
      }
    });
  }

  editSelfuser() {
    const dialogRef = this.dialog.open(SelfuserDialog, {
      data: { ...this.user$ },
    });
  }
}
