/**
 * Tiny, dependency-free markdown renderer.
 * Supports: headings (#, ##, ###), bullet lists (- ), paragraphs,
 * inline `code`, fenced ```code blocks```, **bold**, *italic*, and auto-links.
 * Output is safety-escaped before formatting.
 */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderMarkdown(src: string): string {
  const out: string[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  const inline = (s: string) => {
    let v = esc(s);
    v = v.replace(/`([^`]+)`/g, '<code class="md-code-inline">$1</code>');
    v = v.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    v = v.replace(/(^|[\s(])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
    v = v.replace(
      /(https?:\/\/[^\s<)]+)/g,
      '<a href="$1" target="_blank" rel="noreferrer" class="md-link">$1</a>'
    );
    return v;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      closeList();
      const lang = line.replace(/^```/, "").trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(
        `<pre class="md-pre"><code class="md-code${lang ? ` lang-${esc(lang)}` : ""}">${esc(buf.join("\n"))}</code></pre>`
      );
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level} class="md-h${level}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*-\s+/.test(line)) {
      if (!inList) {
        out.push('<ul class="md-ul">');
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*-\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      closeList();
      i++;
      continue;
    }

    // Paragraph
    closeList();
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|```|\s*-\s)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  closeList();
  return out.join("\n");
}