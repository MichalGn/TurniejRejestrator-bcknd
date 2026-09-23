import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from "@angular/material/card";

type CommentForm = FormGroup<{
  comment: FormControl<string>;
}>;

@Component({
  selector: 'app-comment-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule],
  templateUrl: './comment-panel.html',
  styleUrl: './comment-panel.scss'
})
export class CommentPanel {
    @Input({ required: true }) group!: FormGroup;
    get f() { return this.group.controls as any; }
  // private fb = inject(FormBuilder).nonNullable;

  // // Optional field: no "required" validator, only maxLength
  // form: CommentForm = this.fb.group({
  //   comment: this.fb.control('', { validators: [Validators.maxLength(500)] })
  // });

  // // for template convenience: f.comment...
  // get f(): CommentForm['controls'] { return this.form.controls; }
}
