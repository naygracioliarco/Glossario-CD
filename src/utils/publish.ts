import { GlossaryTerm } from '../types';

export const GLOSSARY_REPO = 'naygracioliarco/Glossario-CD';

export function openSharedPublishIssue(terms: GlossaryTerm[]): 'embedded' | 'clipboard' {
  const json = JSON.stringify(terms, null, 2);
  const title = 'Publicar glossário compartilhado';
  const fullBody = `<!-- glossary-action:replace -->\n\n\`\`\`json\n${json}\n\`\`\`\n`;
  const fullUrl = issueUrl(title, fullBody);

  if (fullUrl.length < 7000) {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    return 'embedded';
  }

  void navigator.clipboard.writeText(json);
  const shortBody =
    '<!-- glossary-action:replace -->\n\nCole aqui o JSON (já está na área de transferência, use Ctrl+V):\n\n```json\n\n```\n';
  window.open(issueUrl(title, shortBody), '_blank', 'noopener,noreferrer');
  return 'clipboard';
}

function issueUrl(title: string, body: string): string {
  const params = new URLSearchParams({
    title,
    labels: 'glossario',
    body,
  });
  return `https://github.com/${GLOSSARY_REPO}/issues/new?${params.toString()}`;
}
