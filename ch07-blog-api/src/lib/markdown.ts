// src/lib/markdown.ts
export function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  html = html
    .split('\n\n')
    .map((block) => {
      if (block.startsWith('<h') || block.startsWith('<ul')) {
        return block
      }
      return `<p>${block}</p>`
    })
    .join('\n')

  return html
}
