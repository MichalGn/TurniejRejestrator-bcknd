import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TokenStorageService } from '../../../_services/auth/token-storage';
import { Md5Service } from '../../../_services/auth/md5';
import { Base64Service } from '../../../_services/auth/base64';
import { SnackbarService } from '../../../_services/shared/snackbar/snackbar';
import { UserData, UserService } from '../../../_services/user/user-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-selfuser-dialog',
  imports: [ 
    CommonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule,
    MatSelectModule, MatOptionModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './selfuser-dialog.html',
  styleUrl: './selfuser-dialog.scss'
})
export class SelfuserDialog  implements OnInit {

  readonly data = inject<UserData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<SelfuserDialog>);
  private tokenStorageService = inject(TokenStorageService);
  public user = this.tokenStorageService.getUser().data;
  changePassword = false;

  private userService = inject(UserService);
  loading: boolean = false;
  existingUsernames: string[] = [];
  usernameExists: boolean = false;

  private md5Service = inject(Md5Service);
  private base64Service = inject(Base64Service);
  private snackbar = inject(SnackbarService);
  private tokenStorage = inject(TokenStorageService);

  ngOnInit(): void {
    this.loading = true;
    this.userService.findUsernames().subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('User names:', response);
        this.existingUsernames = Array.isArray(response?.data) ? response.data : [];
      },
      error: (err) => {
        this.loading = false;
        this.existingUsernames = [];
        console.error('Error loading client names', err);
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddClick(): void {
    const selfuser: any = {
      id: this.user.id,
      username: this.user.username,
      firstname: this.user.firstname,
      lastname: this.user.lastname,
      changePassword: this.changePassword,
    };

    if (this.user.oldPassword && this.user.newPassword) {
      const oldPassMd5 = this.md5Service.createHash(this.user.oldPassword);
      const newPassMd5 = this.md5Service.createHash(this.user.newPassword);

      selfuser.oldPassword = this.base64Service.encode(oldPassMd5);
      selfuser.newPassword = this.base64Service.encode(newPassMd5);
    }

    this.loading = true;
    this.userService.updateSelfuser(selfuser).subscribe({
      next: () => {
        this.dialogRef.close(selfuser)
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.error('Błąd zapisu:', err);
        const msg = (err.error && err.error.message) ? err.error.message : 'Unknown error';
        
        this.snackbar.showError('Nie udało się zmodyfikować użytkownika. ' + msg);
      },
      complete:() => {
        //this.tokenStorage.saveUser(selfuser);
        this.tokenStorage.updateUser(selfuser.username, selfuser.firstname, selfuser.lastname);
        this.loading = false;
        this.snackbar.showSuccess('Użytkownik poprawnie zmodyfikowany.');
      }
    });
  }

  onUsernameChange(username: string | undefined): void {
    //console.log('Username changed to:', username);
    this.usernameExists = !!username && this.existingUsernames.includes(username) && username != this.tokenStorageService.getUser().data.username;
  }

}
