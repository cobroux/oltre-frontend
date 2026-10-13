import { Component, HostListener, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

// Remplace les input[type=time] natifs - rendu incohérent d'un navigateur à
// l'autre (taille des champs, icône horloge non fonctionnelle sur certains)
// et non stylable, même constat que pour les dates. Même principe que
// DatePickerComponent : un déclencheur + un panneau, valeur HH:mm en
// ControlValueAccessor pour rester compatible avec formControlName tel quel.
@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.css',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TimePickerComponent),
    multi: true
  }]
})
export class TimePickerComponent implements ControlValueAccessor {

  @Input() placeholder = '--:--';

  hours = HOURS;
  minutes = MINUTES;

  open = signal(false);
  disabled = signal(false);
  hour = signal<string | null>(null);
  minute = signal<string | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const host = (event.target as HTMLElement)?.closest('app-time-picker');
    if (!host) this.open.set(false);
  }

  writeValue(value: string | null): void {
    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(':');
      this.hour.set(h);
      this.minute.set(this.nearestMinute(m));
    } else {
      this.hour.set(null);
      this.minute.set(null);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open.update(v => !v);
    if (this.open()) this.onTouched();
  }

  pickHour(h: string, event: Event): void {
    event.stopPropagation();
    this.hour.set(h);
    this.commitIfComplete();
  }

  pickMinute(m: string, event: Event): void {
    event.stopPropagation();
    this.minute.set(m);
    this.commitIfComplete();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.hour.set(null);
    this.minute.set(null);
    this.onChange(null);
  }

  displayValue(): string {
    if (this.hour() === null || this.minute() === null) return '';
    return `${this.hour()}:${this.minute()}`;
  }

  private commitIfComplete(): void {
    if (this.hour() !== null && this.minute() !== null) {
      this.onChange(`${this.hour()}:${this.minute()}`);
      this.open.set(false);
    }
  }

  private nearestMinute(m: string): string {
    const n = Math.round(Number(m) / 5) * 5;
    return String(n % 60).padStart(2, '0');
  }
}
