import { GlossaryTerm } from '../types';

export const GLOSSARY_REPO = 'naygracioliarco/Glossario-CD';
const FILE_PATH = 'public/terms.json';

export function getWriteToken(): string {
  return (import.meta.env.VITE_GLOSSARY_WRITE_TOKEN as string | undefined)?.trim() || '';
}

export class GlossaryConflictError extends Error {
  constructor(message = 'O glossário mudou enquanto salvávamos.') {
    super(message);
    this.name = 'GlossaryConflictError';
  }
}

const MERGE_FIELDS: (keyof GlossaryTerm)[] = [
  'term',
  'expansion',
  'definition',
  'example',
  'department',
  'importance',
  'tip',
  'pronunciation',
  'tags',
  'isFavorite',
];

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function mergeTermFields(
  remote: GlossaryTerm,
  local: GlossaryTerm,
  previous?: GlossaryTerm,
): GlossaryTerm {
  if (!previous) {
    return remote;
  }

  const merged: GlossaryTerm = {...remote};
  for (const field of MERGE_FIELDS) {
    if (!valuesEqual(local[field], previous[field])) {
      Object.assign(merged, {[field]: local[field]});
    }
  }
  return merged;
}

export function mergeSharedTerms(
  remote: GlossaryTerm[],
  local: GlossaryTerm[],
  previousShared: GlossaryTerm[],
  deletedIds: string[] = [],
): GlossaryTerm[] {
  const remoteById = new Map(remote.map((term) => [term.id, term]));
  const previousById = new Map(previousShared.map((term) => [term.id, term]));
  const colleagueDeleted = previousShared
    .map((term) => term.id)
    .filter((id) => !remoteById.has(id));
  const deleted = new Set([...deletedIds, ...colleagueDeleted]);
  const merged: GlossaryTerm[] = [];
  const mergedIds = new Set<string>();

  for (const localTerm of local) {
    if (deleted.has(localTerm.id)) {
      continue;
    }
    const remoteTerm = remoteById.get(localTerm.id);
    if (!remoteTerm) {
      merged.push(localTerm);
    } else {
      merged.push(mergeTermFields(remoteTerm, localTerm, previousById.get(localTerm.id)));
    }
    mergedIds.add(localTerm.id);
  }

  for (const term of remote) {
    if (deleted.has(term.id) || mergedIds.has(term.id)) {
      continue;
    }
    merged.push(term);
    mergedIds.add(term.id);
  }

  return merged;
}

export async function fetchGlossaryFile(token?: string): Promise<{terms: GlossaryTerm[]; sha: string}> {
  const [owner, repo] = GLOSSARY_REPO.split('/');
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}?ref=main`,
    {headers, cache: 'no-store'},
  );
  if (!response.ok) {
    throw new Error('Não consegui ler o glossário compartilhado.');
  }

  const payload = (await response.json()) as {content?: string; sha?: string};
  if (!payload.content || !payload.sha) {
    throw new Error('O arquivo compartilhado está vazio.');
  }

  const parsed = JSON.parse(decodeBase64Utf8(payload.content));
  if (!Array.isArray(parsed)) {
    throw new Error('O glossário compartilhado está em um formato inválido.');
  }
  return {terms: parsed, sha: payload.sha};
}

export async function fetchTermsFromGithub(token?: string): Promise<GlossaryTerm[]> {
  const file = await fetchGlossaryFile(token);
  return file.terms;
}

export async function publishTermsToGithub(
  terms: GlossaryTerm[],
  token: string,
  sha: string,
): Promise<void> {
  const authToken = token.trim();
  if (!authToken) {
    throw new Error('A publicação compartilhada ainda não foi configurada.');
  }

  const [owner, repo] = GLOSSARY_REPO.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
  const updateResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'chore: atualizar glossário compartilhado',
      content: encodeUtf8ToBase64(`${JSON.stringify(terms, null, 2)}\n`),
      sha,
      branch: 'main',
    }),
  });

  if (updateResponse.status === 409 || updateResponse.status === 422) {
    throw new GlossaryConflictError();
  }
  if (updateResponse.status === 401 || updateResponse.status === 403) {
    throw new Error('Sem permissão para publicar o glossário compartilhado.');
  }
  if (!updateResponse.ok) {
    const details = (await updateResponse.json().catch(() => null)) as {message?: string} | null;
    throw new Error(details?.message || 'Não foi possível publicar o glossário.');
  }
}

function encodeUtf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
