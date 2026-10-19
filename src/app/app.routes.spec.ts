import { routes } from './app.routes';

describe('routes', () => {
  const find = (path: string) => routes.find(r => r.path === path);

  it('redirige une URL inconnue vers la page d\'accueil', () => {
    expect(find('**')?.redirectTo).toBe('expenses');
  });

  it('sert les rendez-vous sur /appointments et garde /habits en redirection', () => {
    expect(find('appointments')?.loadComponent).toBeDefined();
    expect(find('habits')?.redirectTo).toBe('appointments');
  });

  it('la route par défaut est expenses', () => {
    expect(find('')?.redirectTo).toBe('expenses');
  });
});
