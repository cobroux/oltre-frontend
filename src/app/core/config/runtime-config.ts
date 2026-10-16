declare global {
  interface Window {
    __env?: { apiUrl?: string; demoMode?: string };
  }
}

const DEFAULT_API_URL = 'http://localhost:8080';

export function getApiUrl(): string {
  const configured = typeof window !== 'undefined' ? window.__env?.apiUrl : undefined;
  return configured && configured.trim() !== '' && !configured.startsWith('${')
    ? configured
    : DEFAULT_API_URL;
}

// Vrai seulement si DEMO_MODE=true au démarrage du conteneur (voir docker-entrypoint.sh).
export function isDemoMode(): boolean {
  return typeof window !== 'undefined' && window.__env?.demoMode === 'true';
}

// Faux athlète du profil `demo` du back : identifiants publics.
export const DEMO_EMAIL = 'demo@oltre.dev';
export const DEMO_PASSWORD = 'demo-oltre-2026';
