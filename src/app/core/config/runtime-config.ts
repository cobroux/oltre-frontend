declare global {
  interface Window {
    __env?: { apiUrl?: string };
  }
}

const DEFAULT_API_URL = 'http://localhost:8080';

export function getApiUrl(): string {
  const configured = typeof window !== 'undefined' ? window.__env?.apiUrl : undefined;
  return configured && configured.trim() !== '' && !configured.startsWith('${')
    ? configured
    : DEFAULT_API_URL;
}
