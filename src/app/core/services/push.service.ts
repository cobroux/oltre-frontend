import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { EMPTY, from, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { getApiUrl } from '../config/runtime-config';

export interface PushPreferences {
  apptEnabled: boolean;
  apptMinutesBefore: number;
  tasksEnabled: boolean;
  tasksTime: string; // "HH:mm"
  coachEnabled: boolean;
}
export type PushPreferencesResponse = PushPreferences & { subscriptionCount: number };

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly API = `${getApiUrl()}/api/push`;
  private http = inject(HttpClient);
  // Absent des tests/contextes sans provideServiceWorker.
  readonly swPush = inject(SwPush, { optional: true });

  /** Abonne cet appareil : la permission n'est demandée qu'ici (appelé au clic). */
  subscribe(): Observable<void> {
    const sw = this.swPush!;
    return this.http.get<{ publicKey: string }>(`${this.API}/public-key`).pipe(
      switchMap(({ publicKey }) => from(sw.requestSubscription({ serverPublicKey: publicKey }))),
      switchMap(sub => this.http.post<void>(`${this.API}/subscriptions`, sub.toJSON()))
    );
  }

  unsubscribe(): Observable<void> {
    const sw = this.swPush!;
    return sw.subscription.pipe(
      take(1),
      switchMap(sub => !sub ? EMPTY : // HttpParams laisserait '+' brut (lu comme espace côté serveur) : on encode nous-mêmes.
        this.http.delete<void>(`${this.API}/subscriptions?endpoint=${encodeURIComponent(sub.endpoint)}`)),
      switchMap(() => from(sw.unsubscribe())),
      map(() => undefined)
    );
  }

  getPreferences() {
    return this.http.get<PushPreferencesResponse>(`${this.API}/preferences`);
  }

  savePreferences(p: PushPreferences) {
    return this.http.put<PushPreferencesResponse>(`${this.API}/preferences`, p);
  }

  sendTest() {
    return this.http.post<void>(`${this.API}/test`, null);
  }
}
