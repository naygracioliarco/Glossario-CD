import { GlossaryTerm } from '../types';

const FAVORITES_KEY = 'glossary_favorite_ids_v1';

export function loadFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveFavoriteIds(ids: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
}

export function applyFavoriteState(terms: GlossaryTerm[]): GlossaryTerm[] {
  const ids = loadFavoriteIds();
  return terms.map((term) => ({...term, isFavorite: ids.has(term.id)}));
}

export function toggleFavoriteId(id: string): Set<string> {
  const ids = loadFavoriteIds();
  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  saveFavoriteIds(ids);
  return ids;
}

export function stripFavorites(terms: GlossaryTerm[]): GlossaryTerm[] {
  return terms.map((term) => ({...term, isFavorite: false}));
}
