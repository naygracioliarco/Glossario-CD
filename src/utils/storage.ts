import { GlossaryTerm } from '../types';
import { INITIAL_TERMS } from '../data/defaultTerms';
import { fetchTermsFromGithub, getWriteToken, mergeSharedTerms, publishTermsToGithub } from './publish';

const PENDING_KEY = 'company_glossary_pending_v1';
const LEGACY_LOCAL_KEY = 'company_glossary_terms_v1';

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

export function loadPendingTerms(): GlossaryTerm[] | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY) || localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePendingTerms(terms: GlossaryTerm[] | null): void {
  try {
    if (terms == null) {
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    localStorage.setItem(PENDING_KEY, JSON.stringify(terms));
  } catch (err) {
    console.error('Erro ao guardar alterações locais:', err);
  }
}

export function listsEqual(left: GlossaryTerm[], right: GlossaryTerm[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function persistTerms(
  terms: GlossaryTerm[],
  previousShared: GlossaryTerm[] = terms,
): Promise<GlossaryTerm[]> {
  if (import.meta.env.DEV) {
    const response = await fetch('/__glossary/terms', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(terms),
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
    savePendingTerms(terms);
    throw new Error('A publicação compartilhada ainda não foi configurada.');
  }

  const remote = await fetchTermsFromGithub(token);
  const merged = mergeSharedTerms(remote, terms, previousShared);
  await publishTermsToGithub(merged, token);
  savePendingTerms(null);
  return merged;
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
