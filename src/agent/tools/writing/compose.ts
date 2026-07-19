// WRITE-007 — On-demand composition from prompt/outline/sources/template.
export interface ComposeInput {
  prompt?: string;
  outline?: string[];
  sources?: string[];
  thread?: string;
  template?: string;
}

export function compose(input: ComposeInput): string {
  const parts: string[] = [];
  if (input.template) {
    parts.push(input.template);
  } else {
    if (input.prompt) parts.push(input.prompt);
    if (input.outline?.length) parts.push('## Outline\n' + input.outline.map((o, i) => `${i + 1}. ${o}`).join('\n'));
    if (input.thread) parts.push('## Context from thread\n' + input.thread);
    if (input.sources?.length) parts.push('## Sources\n' + input.sources.map((s) => `- ${s}`).join('\n'));
  }
  return parts.join('\n\n').trim();
}
