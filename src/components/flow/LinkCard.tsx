import { ExternalLink, Github, FileText, X } from "lucide-react";
import type { LinkRef } from "@/lib/types";

function domainFor(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
function pathFor(url: string) {
  try {
    const u = new URL(url);
    const p = (u.pathname + u.search).replace(/\/$/, "");
    return p === "" ? "/" : p;
  } catch { return ""; }
}
function iconFor(url: string) {
  const d = domainFor(url).toLowerCase();
  if (d.includes("github.com")) return Github;
  if (d.includes("docs") || d.includes("notion") || d.includes("readme")) return FileText;
  return ExternalLink;
}

export function LinkCard({ link, onRemove }: { link: LinkRef; onRemove?: () => void }) {
  const Icon = iconFor(link.url);
  const domain = domainFor(link.url);
  const path = pathFor(link.url);
  const display = link.title || path.split("/").filter(Boolean).slice(-2).join("/") || domain;

  return (
    <div className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all">
      <div className="h-7 w-7 rounded-md bg-secondary grid place-items-center shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0"
      >
        <div className="text-[12.5px] font-medium text-foreground truncate">{display}</div>
        <div className="text-[10.5px] text-muted-foreground truncate">{domain}</div>
      </a>
      {onRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-6 w-6 grid place-items-center rounded"
          aria-label="Remove link"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}