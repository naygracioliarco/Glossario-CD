import { GlossaryTerm } from '../types';
import { INITIAL_TERMS } from '../data/defaultTerms';

const STORAGE_KEY = 'company_glossary_terms_v1';

export function loadTerms(): GlossaryTerm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTerms(INITIAL_TERMS);
      return INITIAL_TERMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TERMS;
  } catch (err) {
    console.error('Erro ao carregar dados do LocalStorage:', err);
    return INITIAL_TERMS;
  }
}

export function saveTerms(terms: GlossaryTerm[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch (err) {
    console.error('Erro ao salvar termos no LocalStorage:', err);
  }
}

export function resetToDefaults(): GlossaryTerm[] {
  saveTerms(INITIAL_TERMS);
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

  const rows = terms.map(t => [
    escapeCSV(t.term),
    escapeCSV(t.expansion),
    escapeCSV(t.definition),
    escapeCSV(t.example),
    escapeCSV(t.department),
    escapeCSV(t.importance),
    escapeCSV(t.tip || ''),
    escapeCSV(t.pronunciation || ''),
  ].join(';'));

  // UTF-8 BOM so Excel opens Portuguese accented characters properly
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // Determine separator: ';' or ','
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';

  const newTerms: Partial<GlossaryTerm>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser for quoted or unquoted values
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
      const department = parts[4] ? (parts[4].trim() as any) : 'Geral & Comunicação';

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
