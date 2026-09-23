import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-input-dialog',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './input-dialog.html',
  styleUrl: './input-dialog.scss'
})
export class InputDialog implements AfterViewInit {
  @ViewChild(MatInput) inputField!: MatInput;
  newName: string = '';

  constructor(private dialogRef: MatDialogRef<InputDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      defaultValue: string;
      inputType?: 'text' | 'date' | 'number';
    },
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit() {
    if (this.data.defaultValue !== null && this.data.defaultValue !== undefined) {
      this.newName = this.data.defaultValue;
    }
    this.inputField.focus();
    this.cdr.detectChanges();
  }

  closeDialog(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    this.dialogRef.close(this.newName);
  }

}
