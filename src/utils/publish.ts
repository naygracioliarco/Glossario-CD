import { GlossaryTerm } from '../types';

export const GLOSSARY_REPO = 'naygracioliarco/Glossario-CD';
const FILE_PATH = 'public/terms.json';

export function getWriteToken(): string {
  return (import.meta.env.VITE_GLOSSARY_WRITE_TOKEN as string | undefined)?.trim() || '';
}

export function mergeSharedTerms(
  remote: GlossaryTerm[],
  local: GlossaryTerm[],
  _previousShared: GlossaryTerm[],
  deletedIds: string[] = [],
): GlossaryTerm[] {
  const deleted = new Set(deletedIds);
  const merged = local.filter((term) => !deleted.has(term.id));
  const mergedIds = new Set(merged.map((term) => term.id));

  for (const term of remote) {
    if (deleted.has(term.id) || mergedIds.has(term.id)) {
      continue;
    }
    merged.push(term);
    mergedIds.add(term.id);
  }

  return merged;
}

export async function fetchTermsFromGithub(token?: string): Promise<GlossaryTerm[]> {
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
    {headers},
  );
  if (!response.ok) {
    throw new Error('Não consegui ler o glossário compartilhado.');
  }

  const payload = (await response.json()) as {content?: string};
  if (!payload.content) {
    throw new Error('O arquivo compartilhado está vazio.');
  }

  const parsed = JSON.parse(decodeBase64Utf8(payload.content));
  if (!Array.isArray(parsed)) {
    throw new Error('O glossário compartilhado está em um formato inválido.');
  }
  return parsed;
}

export async function publishTermsToGithub(
  terms: GlossaryTerm[],
  token: string,
  attempt = 0,
): Promise<void> {
  const authToken = token.trim();
  if (!authToken) {
    throw new Error('A publicação compartilhada ainda não foi configurada.');
  }

  const [owner, repo] = GLOSSARY_REPO.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${FILE_PATH}`;
  const requestHeaders = {
    Authorization: `Bearer ${authToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const currentResponse = await fetch(`${apiUrl}?ref=main`, {headers: requestHeaders});
  if (currentResponse.status === 401 || currentResponse.status === 403) {
    throw new Error('Sem permissão para publicar o glossário compartilhado.');
  }
  if (!currentResponse.ok) {
    throw new Error('Não consegui ler o glossário compartilhado.');
  }

  const current = (await currentResponse.json()) as {sha?: string};
  if (!current.sha) {
    throw new Error('Não encontrei a versão atual do glossário.');
  }

  const updateResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      ...requestHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'chore: atualizar glossário compartilhado',
      content: encodeUtf8ToBase64(`${JSON.stringify(terms, null, 2)}\n`),
      sha: current.sha,
      branch: 'main',
    }),
  });

  if (updateResponse.status === 409 && attempt < 2) {
    return publishTermsToGithub(terms, token, attempt + 1);
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
