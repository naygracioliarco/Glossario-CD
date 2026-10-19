import { GlossaryTerm } from '../types';
import { INITIAL_TERMS } from '../data/defaultTerms';
import {stripFavorites} from './favorites';
import {
  fetchGlossaryFile,
  fetchTermsFromGithub,
  getWriteToken,
  GlossaryConflictError,
  mergeSharedTerms,
  publishTermsToGithub,
} from './publish';

const PENDING_KEY = 'company_glossary_pending_v2';
const LEGACY_PENDING_KEY = 'company_glossary_pending_v1';
const LEGACY_LOCAL_KEY = 'company_glossary_terms_v1';
const TOMBSTONE_KEY = 'glossary_deleted_ids_v1';

export interface PendingGlossaryState {
  terms: GlossaryTerm[];
  deletedIds: string[];
}

export function sharedTermsUrl(): string {
  return `${import.meta.env.BASE_URL}terms.json`;
}

export async function loadSharedTerms(): Promise<GlossaryTerm[]> {
  const token = getWriteToken();
  if (token) {
    try {
      return await fetchTermsFromGithub(token);
    } catch (err) {
      console.error('Erro ao carregar o glossário no GitHub:', err);
    }
  }

  try {
    const response = await fetch(`${sharedTermsUrl()}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) {
      return INITIAL_TERMS;
    }
    const parsed = await response.json();
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_TERMS;
  } catch (err) {
    console.error('Erro ao carregar o glossário compartilhado:', err);
    return INITIAL_TERMS;
  }
}

export function loadPendingState(): PendingGlossaryState | null {
  try {
    const raw =
      localStorage.getItem(PENDING_KEY) ||
      localStorage.getItem(LEGACY_PENDING_KEY) ||
      localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {terms: parsed, deletedIds: []};
    }
    if (parsed && Array.isArray(parsed.terms)) {
      return {
        terms: parsed.terms,
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function loadPendingTerms(): GlossaryTerm[] | null {
  return loadPendingState()?.terms ?? null;
}

export function loadTombstones(): string[] {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveTombstones(ids: string[]): void {
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    localStorage.removeItem(TOMBSTONE_KEY);
    return;
  }
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(unique));
}

export function pruneTombstones(remote: GlossaryTerm[]): string[] {
  const remoteIds = new Set(remote.map((term) => term.id));
  const remaining = loadTombstones().filter((id) => remoteIds.has(id));
  saveTombstones(remaining);
  return remaining;
}

export function savePendingTerms(terms: GlossaryTerm[] | null, deletedIds: string[] = []): void {
  try {
    if (terms == null) {
      localStorage.removeItem(PENDING_KEY);
      localStorage.removeItem(LEGACY_PENDING_KEY);
      return;
    }
    localStorage.setItem(PENDING_KEY, JSON.stringify({terms, deletedIds}));
  } catch (err) {
    console.error('Erro ao guardar alterações locais:', err);
  }
}

export function listsEqual(left: GlossaryTerm[], right: GlossaryTerm[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function takeSharedWithLocalIntent(
  shared: GlossaryTerm[],
  pending: GlossaryTerm[] | null,
  deletedIds: string[] = [],
): GlossaryTerm[] {
  const deleted = new Set(deletedIds);
  const sharedIds = new Set(shared.map((term) => term.id));
  const unpublishedAdds = (pending ?? []).filter(
    (term) => !sharedIds.has(term.id) && !deleted.has(term.id),
  );
  return [...unpublishedAdds, ...shared.filter((term) => !deleted.has(term.id))];
}

export function reconcilePending(
  shared: GlossaryTerm[],
  pending: GlossaryTerm[] | null,
  deletedIds: string[] = [],
  previousShared: GlossaryTerm[] = shared,
): GlossaryTerm[] {
  return mergeSharedTerms(shared, pending ?? previousShared, previousShared, deletedIds);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function persistTerms(
  terms: GlossaryTerm[],
  previousShared: GlossaryTerm[] = terms,
  deletedIds: string[] = [],
): Promise<GlossaryTerm[]> {
  const localTerms = stripFavorites(terms);
  const previous = stripFavorites(previousShared);

  if (import.meta.env.DEV) {
    const response = await fetch('/__glossary/terms', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(localTerms),
    });
    if (!response.ok) {
      throw new Error('Falha ao salvar o glossário no arquivo compartilhado');
    }
  }

  const token = getWriteToken();
  if (!token) {
    if (import.meta.env.DEV) {
      savePendingTerms(null);
      return terms;
    }
    savePendingTerms(localTerms, deletedIds);
    throw new Error('A publicação compartilhada ainda não foi configurada.');
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const file = await fetchGlossaryFile(token);
      const merged = mergeSharedTerms(
        stripFavorites(file.terms),
        localTerms,
        previous,
        deletedIds,
      );
      await publishTermsToGithub(merged, token, file.sha);
      savePendingTerms(merged, deletedIds);
      return merged;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Não foi possível salvar.');
      if (!(error instanceof GlossaryConflictError) || attempt === 4) {
        throw lastError;
      }
      await sleep(250 * 2 ** attempt);
    }
  }

  throw lastError ?? new Error('Não foi possível publicar o glossário.');
}

export function resetToDefaults(): GlossaryTerm[] {
  return INITIAL_TERMS;
}

export function exportToJSON(terms: GlossaryTerm[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(terms, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `glossario-siglas-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCSV(terms: GlossaryTerm[]): void {
  const headers = ['Sigla', 'Significado Completo', 'Definição', 'Exemplo de Uso', 'Departamento', 'Importância', 'Dica', 'Como Falar'];

  const escapeCSV = (str: string | undefined) => {
    if (!str) return '""';
    const clean = str.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = terms.map((t) =>
    [
      escapeCSV(t.term),
      escapeCSV(t.expansion),
      escapeCSV(t.definition),
      escapeCSV(t.example),
      escapeCSV(t.department),
      escapeCSV(t.importance),
      escapeCSV(t.tip || ''),
      escapeCSV(t.pronunciation || ''),
    ].join(';'),
  );

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `glossario-siglas-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseCSVInput(csvText: string): Partial<GlossaryTerm>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const newTerms: Partial<GlossaryTerm>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts: string[] = [];
    let insideQuotes = false;
    let currentPart = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' && (c === 0 || line[c - 1] !== '\\')) {
        insideQuotes = !insideQuotes;
      } else if (char === separator && !insideQuotes) {
        parts.push(currentPart.trim().replace(/^"|"$/g, ''));
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.trim().replace(/^"|"$/g, ''));

    if (parts.length >= 2 && parts[0]) {
      const termName = parts[0].trim();
      const expansion = parts[1] ? parts[1].trim() : '';
      const definition = parts[2] ? parts[2].trim() : 'Definição a preencher.';
      const example = parts[3] ? parts[3].trim() : '';
      const department = parts[4] ? (parts[4].trim() as GlossaryTerm['department']) : 'Geral & Comunicação';

      newTerms.push({
        id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        term: termName,
        expansion: expansion || termName,
        definition: definition,
        example: example || `Exemplo com ${termName} no dia a dia.`,
        department: department || 'Geral & Comunicação',
        importance: 'frequente',
        tags: [],
        isFavorite: false,
      });
    }
  }

  return newTerms;
}
