export function initialsOf(username: string | null | undefined): string {
  return (username ?? '').slice(0, 2).toUpperCase();
}
