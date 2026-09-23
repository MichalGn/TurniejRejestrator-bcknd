import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-label-value',
  imports: [],
  templateUrl: './label-value.html',
  styleUrl: './label-value.scss'
})
export class LabelValue {
  @Input() label!: string;
  @Input() value: string | number | null | undefined;
}
