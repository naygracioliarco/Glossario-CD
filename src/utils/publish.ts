import { GlossaryTerm } from '../types';

export const GLOSSARY_REPO = 'naygracioliarco/Glossario-CD';
export const TOKEN_SETUP_URL =
  'https://github.com/settings/personal-access-tokens/new';

const TOKEN_KEY = 'glossary_github_token';
const FILE_PATH = 'public/terms.json';

export function getGithubToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function hasGithubToken(): boolean {
  return getGithubToken().length > 0;
}

export function saveGithubToken(token: string): void {
  const value = token.trim();
  if (!value) {
    clearGithubToken();
    return;
  }
  localStorage.setItem(TOKEN_KEY, value);
}

export function clearGithubToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function publishTermsToGithub(terms: GlossaryTerm[], token: string): Promise<void> {
  const authToken = token.trim();
  if (!authToken) {
    throw new Error('Informe o token para publicar neste site.');
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
    throw new Error('Token inválido ou sem permissão neste repositório.');
  }
  if (!currentResponse.ok) {
    throw new Error('Não consegui ler o glossário compartilhado.');
  }

  const current = (await currentResponse.json()) as {sha?: string};
  if (!current.sha) {
    throw new Error('Não encontrei a versão atual do glossário.');
  }

  const fileContent = `${JSON.stringify(terms, null, 2)}\n`;
  const updateResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      ...requestHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'chore: atualizar glossário compartilhado',
      content: encodeUtf8ToBase64(fileContent),
      sha: current.sha,
      branch: 'main',
    }),
  });

  if (updateResponse.status === 401 || updateResponse.status === 403) {
    throw new Error('Token inválido ou sem permissão para publicar.');
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
