import { TEAM_PASSWORD } from '../data/shareConfig';

const UNLOCK_KEY = 'glossary_team_unlocked';

export function teamPassword(): string {
  return (import.meta.env.VITE_TEAM_PASSWORD as string | undefined)?.trim() || TEAM_PASSWORD;
}

export function isTeamUnlocked(): boolean {
  if (!teamPassword()) {
    return true;
  }
  try {
    return localStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockTeam(password: string): boolean {
  if (password.trim() === teamPassword()) {
    localStorage.setItem(UNLOCK_KEY, '1');
    return true;
  }
  return false;
}
