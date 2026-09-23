import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CreateUserData, UpdateUserData, UserData, UserService } from '../../../../_services/user/user-service';
import { Base64Service } from '../../../../_services/auth/base64';
import { Md5Service } from '../../../../_services/auth/md5';
import { SnackbarService } from '../../../../_services/shared/snackbar/snackbar';

@Component({
  selector: 'app-user-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule
  ],
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<UserDialog>);
  readonly data = inject<UserData>(MAT_DIALOG_DATA);
  readonly service = inject(UserService);
  readonly md5Service = inject(Md5Service);
  readonly base64Service = inject(Base64Service);
  readonly snackbar = inject(SnackbarService);

  readonly edit = this.data.username.length > 0;
  readonly title = this.edit ? 'Edytuj użytkownika' : 'Dodaj użytkownika';
  readonly buttonDesc = this.edit ? 'Edytuj' : 'Zapisz';

  username: string = this.data.username;
  firstname: string = this.data.firstname;
  lastname: string = this.data.lastname;
  password: string = this.data.password;
  repeatPassword: string = this.data.password;
  isAdmin: boolean = this.data.admin ?? false;
  isActive: boolean = this.data.active ?? false;

  loading: boolean = false;
  existingUsernames: string[] = [];
  usernameExists: boolean = false;

  clientNames: string[] = [];
  selectedClients: string[] = [];
  changePassword = false;

  ngOnInit(): void {
    // Ustawienia checkboxów
    this.isAdmin = this.data.admin ?? false;
    this.isActive = this.data.active ?? false;
    this.loading = true;
    this.service.findUsernames().subscribe({
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

    console.log("dataaa:", this.data)
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddClick(): void {
    if (this.username.length === 0 || this.password.length === 0) return;
    if (this.password !== this.repeatPassword) return;

    const createUser: CreateUserData = {
      username: this.username,
      firstname: this.firstname,
      lastname: this.lastname,
      password: this.base64Service.encode(this.md5Service.createHash(this.password)),
      admin: this.isAdmin,
    };
    const saveCall = this.service.saveUser(createUser);

    saveCall.subscribe({
      next: () => this.dialogRef.close(),
      error: (err) => {
        console.error('Błąd zapisu użytkownika:', err);
        this.snackbar.showError(
          'Nie udało się utworzyć użytkownika.'
        );
      },
    });
  }

  onEditClick(): void {
    if (this.username.length === 0 || this.password.length === 0) return;
    if (this.password !== this.repeatPassword) return;

    const updateUser: UpdateUserData = {
      id: this.data.id!!,
      username: this.username,
      firstname: this.firstname,
      lastname: this.lastname,
      password: this.changePassword ? this.base64Service.encode(this.md5Service.createHash(this.password)) : null,
      admin: this.isAdmin,
      active: this.isActive,
    };

    this.service.updateUser(updateUser).subscribe({
      next: () => this.dialogRef.close(),
      error: (err) => {
        console.error('Błąd modyfikacji użytkownika:', err);
        this.snackbar.showError(
          'Nie udało się zmodyfikować użytkownika.'
        );
      },
    });
  }
/*
  xonAddClick(): void {
    if (this.username.length === 0 || this.password.length === 0) return;
    if (this.password !== this.repeatPassword) return;

    const createUser: CreateUserData = {
      username: this.username,
      firstname: this.firstname,
      lastname: this.lastname,
      password: this.base64Service.encode(this.md5Service.createHash(this.password)),
      admin: this.isAdmin,
    };

    const updateUser: UpdateUserData = {
      id: this.data.id!!,
      username: this.username,
      firstname: this.firstname,
      lastname: this.lastname,
      password: this.base64Service.encode(this.md5Service.createHash(this.password)),
      admin: this.isAdmin,
      softDeleted: false,
    };

    const saveCall = this.edit
      ? this.service.updateUser(updateUser)
      : this.service.saveUser(createUser);

    saveCall.subscribe({
      next: () => this.dialogRef.close(),
      error: (err) => {
        console.error('Błąd zapisu użytkownika:', err);
        this.snackbar.showError(
          this.edit
            ? 'Nie udało się zmodyfikować użytkownika.'
            : 'Nie udało się utworzyć użytkownika.'
        );
      },
    });
  }
*/
  /*
  onAddClick(): void {
    if (this.username.length === 0 || this.password.length === 0) return;
    if (this.password !== this.repeatPassword) return;

    const hashedPass = this.base64Service.encode(
      this.md5Service.createHash(this.password)
    );

    const user: UserData = {
      id: this.edit ? this.data.id : undefined,
      username: this.username,
      firstname: this.firstname,
      lastname: this.lastname,
      password: this.base64Service.encode(this.md5Service.createHash(this.password)),
      admin: this.isAdmin,
      softDeleted: false,
    };

    const saveCall = this.edit
      ? this.service.updateUser(user)
      : this.service.saveUser(user);

    saveCall.subscribe({
      next: () => this.dialogRef.close(user),
      error: (err) => {
        console.error('Błąd zapisu użytkownika:', err);
        this.snackbar.showError(
          this.edit
            ? 'Nie udało się zmodyfikować użytkownika.'
            : 'Nie udało się utworzyć użytkownika.'
        );
      }
    });
  }
    */

  onUsernameChange(username: string | undefined): void {
    console.log('Username changed to:', username);
    this.usernameExists = !!username && this.existingUsernames.includes(username);
  }
}
