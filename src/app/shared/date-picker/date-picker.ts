import { Component, HostListener, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

interface DayCell {
  date: Date;
  day: number;
  outside: boolean;
  today: boolean;
  selected: boolean;
}

// Remplace les input[type=date] natifs (apparence incohérente d'un
// navigateur à l'autre, calendrier non stylable) par un calendrier maison
// aux couleurs d'Oltre. S'utilise exactement comme un input via
// formControlName - la valeur transite toujours au format ISO (yyyy-MM-dd)
// pour ne rien changer côté backend/services.
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePickerComponent),
    multi: true
  }]
})
export class DatePickerComponent implements ControlValueAccessor {

  @Input() placeholder = 'Sélectionner une date';

  open = signal(false);
  disabled = signal(false);
  selected = signal<Date | null>(null);
  viewMonth = signal<Date>(this.startOfMonth(new Date()));

  weekdays = WEEKDAYS;

  days = signal<DayCell[]>([]);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.rebuildDays();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const host = (event.target as HTMLElement)?.closest('app-date-picker');
    if (!host) this.open.set(false);
  }

  writeValue(value: string | null): void {
    const date = value ? this.parseIso(value) : null;
    this.selected.set(date);
    this.viewMonth.set(this.startOfMonth(date ?? new Date()));
    this.rebuildDays();
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

  clear(event: Event): void {
    event.stopPropagation();
    this.selected.set(null);
    this.onChange(null);
  }

  prevMonth(event: Event): void {
    event.stopPropagation();
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
    this.rebuildDays();
  }

  nextMonth(event: Event): void {
    event.stopPropagation();
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
    this.rebuildDays();
  }

  selectDay(cell: DayCell, event: Event): void {
    event.stopPropagation();
    this.selected.set(cell.date);
    this.onChange(this.toIso(cell.date));
    this.open.set(false);
  }

  goToday(event: Event): void {
    event.stopPropagation();
    this.viewMonth.set(this.startOfMonth(new Date()));
    this.rebuildDays();
  }

  monthLabel(): string {
    const m = this.viewMonth();
    return MONTHS[m.getMonth()] + ' ' + m.getFullYear();
  }

  displayValue(): string {
    const d = this.selected();
    if (!d) return '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  private rebuildDays(): void {
    const view = this.viewMonth();
    const year = view.getFullYear();
    const month = view.getMonth();
    const today = new Date();
    const selected = this.selected();

    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: DayCell[] = [];

    for (let i = 0; i < firstDow; i++) {
      const d = daysInPrevMonth - firstDow + i + 1;
      cells.push(this.makeCell(new Date(year, month - 1, d), true, today, selected));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(this.makeCell(new Date(year, month, d), false, today, selected));
    }
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      cells.push(this.makeCell(new Date(year, month + 1, i), true, today, selected));
    }

    this.days.set(cells);
  }

  private makeCell(date: Date, outside: boolean, today: Date, selected: Date | null): DayCell {
    return {
      date,
      day: date.getDate(),
      outside,
      today: this.sameDay(date, today),
      selected: !!selected && this.sameDay(date, selected)
    };
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  // Les input[type=date] natifs produisaient du yyyy-MM-dd en heure locale
  // (pas d'UTC) - on garde exactement le même format pour ne rien changer
  // côté consommateurs de la valeur du form control.
  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseIso(value: string): Date | null {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
}
