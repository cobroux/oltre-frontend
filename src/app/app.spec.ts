import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  const versionUpdates = new Subject<VersionEvent>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'a', children: [] }, { path: 'b', children: [] }]),
        { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates } },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('recharge à la navigation suivante quand une nouvelle version est prête', async () => {
    const fixture = TestBed.createComponent(App);
    const reload = vi.spyOn(fixture.componentInstance as never as { reload: () => void }, 'reload').mockImplementation(() => {});
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/a');
    expect(reload).not.toHaveBeenCalled();

    versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
    expect(reload).not.toHaveBeenCalled();

    await router.navigateByUrl('/b');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
