import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CircleAlert,
  Loader2,
  Printer,
  FileDown,
  Sparkles,
  Star,
  ChevronLeft,
  Share2,
  Save,
  MoreHorizontal,
  Smartphone,
  Link2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wordmark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { AiAssistant } from "@/components/editor/AiAssistant";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { PageSetupMenu } from "@/components/editor/PageSetupMenu";
import { countWords, stripHtml, UNTITLED, uploadDocumentImage } from "@/lib/documents";
import { DEFAULT_PAGE_SETUP, pageMetrics, type PageSetup } from "@/lib/page-setup";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export type EditorDocument = {
  id: string;
  title: string;
  content: string;
  page_setup?: PageSetup;
  is_favorite?: boolean;
  share_token?: string;
  share_role?: string;
};

export function DocumentEditor({
  doc,
  readOnly = false,
  onSave,
  onToggleFavorite,
  onShareChange,
  onPageSetupChange,
}: {
  doc: EditorDocument;
  readOnly?: boolean;
  onSave: (patch: { title: string; content: string; plain_text: string }) => Promise<void>;
  onToggleFavorite?: () => void;
  onShareChange?: (role: string) => Promise<void>;
  onPageSetupChange?: (setup: PageSetup) => Promise<void>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(doc.title || UNTITLED);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [words, setWords] = useState(() => countWords(stripHtml(doc.content)));
  const [aiOpen, setAiOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [setup, setSetup] = useState<PageSetup>(doc.page_setup ?? DEFAULT_PAGE_SETUP);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);

  const titleRefLatest = useRef(title);
  titleRefLatest.current = title;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const metrics = useMemo(() => pageMetrics(setup), [setup]);

  useEffect(() => {
    if (canvasRef.current && canvasRef.current.innerHTML !== doc.content) {
      canvasRef.current.innerHTML = doc.content;
    }
    setTitle(doc.title || UNTITLED);
    setSetup(doc.page_setup ?? DEFAULT_PAGE_SETUP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  const persist = useCallback(async () => {
    if (readOnly) return;
    if (timer.current) clearTimeout(timer.current);
    const html = canvasRef.current?.innerHTML ?? "";
    const clean = titleRefLatest.current.trim() || UNTITLED;
    setSaveState("saving");
    try {
      await onSave({ title: clean, content: html, plain_text: stripHtml(html) });
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  }, [onSave, readOnly]);

  const scheduleSave = useCallback(() => {
    if (readOnly) return;
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 1200);
  }, [persist, readOnly]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persist();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [persist]);

  /* ---------- pagination + responsive scaling ---------- */
  const measure = useCallback(() => {
    const contentH = canvasRef.current?.scrollHeight ?? 0;
    const pages = Math.max(1, Math.ceil((contentH + 1) / metrics.contentHeight));
    setPageCount(pages);
  }, [metrics.contentHeight]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [measure, doc.id]);

  useLayoutEffect(() => {
    function fit() {
      const avail = frameRef.current?.clientWidth ?? metrics.width;
      setScale(Math.min(1, avail / metrics.width));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [metrics.width]);

  const exec = useCallback(
    (command: string, value?: string) => {
      if (readOnly) return;
      canvasRef.current?.focus();
      if (command === "__pxSize") {
        canvasRef.current?.querySelectorAll('font[size="7"]').forEach((f) => {
          const span = document.createElement("span");
          span.style.fontSize = `${value}px`;
          span.innerHTML = f.innerHTML;
          f.replaceWith(span);
        });
      } else {
        document.execCommand(command, false, value);
      }
      handleInput();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly],
  );

  function handleInput() {
    const html = canvasRef.current?.innerHTML ?? "";
    setWords(countWords(stripHtml(html)));
    measure();
    scheduleSave();
  }

  function insertHtml(html: string) {
    canvasRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    handleInput();
  }

  function commitTitle() {
    const next = (titleRef.current?.innerText ?? "").replace(/\s+/g, " ").trim();
    const clean = next || UNTITLED;
    if (titleRef.current && titleRef.current.innerText !== clean) titleRef.current.innerText = clean;
    setTitle(clean);
    titleRefLatest.current = clean;
    void persist();
  }

  const status = useMemo(() => {
    if (readOnly) return { label: "View only", icon: Check };
    if (saveState === "saving") return { label: "Saving…", icon: Loader2 };
    if (saveState === "error") return { label: "Not saved", icon: CircleAlert };
    if (saveState === "dirty") return { label: "Unsaved changes", icon: CircleAlert };
    return { label: "Saved", icon: Check };
  }, [saveState, readOnly]);

  async function exportFile(kind: "txt" | "docx" | "html") {
    const html = canvasRef.current?.innerHTML ?? "";
    if (kind === "txt")
      return saveToDevice(`${title}.txt`, stripHtml(html), "text/plain", [".txt"]);
    const wrapped = `<!DOCTYPE html><html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(
      title,
    )}</title></head><body style="font-family:'Plus Jakarta Sans',Arial,sans-serif;line-height:1.7"><h1>${escapeHtml(
      title,
    )}</h1>${html}</body></html>`;
    await saveToDevice(
      `${title}.${kind === "docx" ? "doc" : "html"}`,
      wrapped,
      kind === "docx" ? "application/msword" : "text/html",
      [kind === "docx" ? ".doc" : ".html"],
    );
  }

  async function copyCloudLink() {
    try {
      if (doc.share_role === "none" || !doc.share_role) await onShareChange?.("viewer");
      const url = `${window.location.origin}/share/${doc.share_token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Cloud link copied", { description: url });
    } catch {
      toast.error("Could not create the link");
    }
  }

  async function handlePickImage(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const id = toast.loading("Uploading image…");
    try {
      const url = await uploadDocumentImage(file);
      insertHtml(
        `<img src="${escapeHtml(url)}" alt="${escapeHtml(file.name)}" style="max-width:100%" />`,
      );
      toast.success("Image added", { id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id });
    }
  }

  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:px-4">
          {readOnly ? (
            <Wordmark size={30} />
          ) : (
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Back to dashboard">
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate px-1 text-sm font-semibold sm:text-base">{title}</p>
            <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <StatusIcon className={cn("h-3 w-3", saveState === "saving" && "animate-spin")} />
                {status.label}
              </span>
              <span>·</span>
              <span>{words} words</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                {pageCount} {pageCount === 1 ? "page" : "pages"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {!readOnly && (
              <Button
                size="sm"
                onClick={() => void persist()}
                disabled={saveState === "saving"}
                className="rounded-full bg-brand-gradient px-3 shadow-brand transition-transform active:scale-95 sm:px-4"
              >
                {saveState === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-1.5" />
                ) : (
                  <Save className="h-4 w-4 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">Save</span>
              </Button>
            )}
            {!readOnly && onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 md:inline-flex"
                aria-label="Toggle favourite"
                onClick={onToggleFavorite}
              >
                <Star className={cn("h-4 w-4", doc.is_favorite && "fill-amber-400 text-amber-500")} />
              </Button>
            )}
            <span className="inline-flex">
              <PageSetupMenu
                setup={setup}
                disabled={readOnly}
                onChange={(next) => {
                  setSetup(next);
                  void onPageSetupChange?.(next);
                }}
              />
            </span>
            {!readOnly && onShareChange && (
              <Button
                variant="outline"
                size="sm"
                className="hidden rounded-full border-border/70 md:inline-flex"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Export"
                  className="hidden rounded-full border-border/70 md:inline-flex"
                >
                  <FileDown className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportFile("docx")}>
                  <Smartphone className="mr-2 h-4 w-4" /> Save to device (DOCX)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportFile("txt")}>
                  <Smartphone className="mr-2 h-4 w-4" /> Save to device (TXT)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportFile("html")}>
                  <Smartphone className="mr-2 h-4 w-4" /> Save to device (HTML)
                </DropdownMenuItem>
                {onShareChange && doc.share_token && (
                  <DropdownMenuItem onClick={() => void copyCloudLink()}>
                    <Link2 className="mr-2 h-4 w-4" /> Copy cloud link
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="hidden md:inline-flex">
              <ThemeToggle />
            </span>
            {!readOnly && (
              <Button
                variant={aiOpen ? "secondary" : "outline"}
                size="sm"
                className="rounded-full border-border/70"
                onClick={() => setAiOpen((v) => !v)}
              >
                <Sparkles className="h-4 w-4 text-primary sm:mr-1.5" />
                <span className="hidden sm:inline">AI</span>
              </Button>
            )}

            {/* Compact overflow for small screens */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="More actions"
                  className="h-9 w-9 md:hidden"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {!readOnly && onToggleFavorite && (
                  <DropdownMenuItem onClick={onToggleFavorite}>
                    <Star
                      className={cn(
                        "mr-2 h-4 w-4",
                        doc.is_favorite && "fill-amber-400 text-amber-500",
                      )}
                    />
                    {doc.is_favorite ? "Remove favourite" : "Add to favourites"}
                  </DropdownMenuItem>
                )}
                {!readOnly && onShareChange && (
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportFile("docx")}>
                  <Smartphone className="mr-2 h-4 w-4" /> Save to phone (DOCX)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportFile("txt")}>
                  <Smartphone className="mr-2 h-4 w-4" /> Save to phone (TXT)
                </DropdownMenuItem>
                {onShareChange && doc.share_token && (
                  <DropdownMenuItem onClick={() => void copyCloudLink()}>
                    <Link2 className="mr-2 h-4 w-4" /> Copy cloud link
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!readOnly && (
          <div className="mx-auto max-w-7xl px-3 pb-2 sm:px-4">
            <EditorToolbar
              exec={exec}
              onInsertLink={() => {
                const url = window.prompt("Link URL", "https://");
                if (url) exec("createLink", url);
              }}
              onInsertImage={() => fileRef.current?.click()}
              onInsertTable={() => {
                const rows = Number(window.prompt("Rows", "3") ?? 0);
                const cols = Number(window.prompt("Columns", "3") ?? 0);
                if (!rows || !cols) return;
                const body = Array.from({ length: rows })
                  .map(
                    () =>
                      `<tr>${Array.from({ length: cols })
                        .map(() => "<td><br/></td>")
                        .join("")}</tr>`,
                  )
                  .join("");
                insertHtml(`<table><tbody>${body}</tbody></table><p><br/></p>`);
              }}
            />
          </div>
        )}
      </header>

      <main className="mx-auto flex max-w-7xl items-start gap-4 px-3 py-6 sm:px-4">
        <div ref={frameRef} className="min-w-0 flex-1">
          <div
            className="mx-auto"
            style={{
              height: metrics.height * pageCount * scale,
              width: metrics.width * scale,
              maxWidth: "100%",
            }}
          >
            <div
              className="origin-top-left"
              style={{ width: metrics.width, transform: `scale(${scale})` }}
            >
              <div ref={paperRef} className="print-area relative">
                {/* paper stack with page separations */}
                <div
                  aria-hidden="true"
                  className="page-stack absolute inset-x-0 top-0"
                  style={{ height: metrics.height * pageCount }}
                >
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <div key={i} className="page-guide" style={{ top: (i + 1) * metrics.height - 1 }}>
                      <span className="page-number">Page {i + 1}</span>
                      {i + 1 < pageCount && <span className="page-number next">Page {i + 2}</span>}
                    </div>
                  ))}
                </div>

                {/* flowing content laid over the sheets */}
                <div
                  className="relative"
                  style={{ paddingTop: metrics.margin, paddingLeft: metrics.margin, paddingRight: metrics.margin }}
                >
                  <h1
                    ref={titleRef}
                    className="doc-title mb-4 font-display text-3xl font-bold outline-none"
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    spellCheck={false}
                    data-placeholder={UNTITLED}
                    onInput={() => setSaveState("dirty")}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitTitle();
                        canvasRef.current?.focus();
                      }
                    }}
                    role="textbox"
                    aria-label="Document title"
                  >
                    {title}
                  </h1>
                  <div
                    ref={canvasRef}
                    className="doc-canvas"
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onBlur={() => saveState === "dirty" && void persist()}
                    data-placeholder="Start writing your document…"
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Document body"
                  />
                  <div style={{ height: metrics.margin }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {aiOpen && !readOnly && (
          <AiAssistant
            getSelection={() => {
              const sel = window.getSelection()?.toString();
              return sel && sel.trim()
                ? sel
                : stripHtml(canvasRef.current?.innerHTML ?? "").slice(0, 8000);
            }}
            onInsert={(html) => insertHtml(html)}
            onClose={() => setAiOpen(false)}
          />
        )}
      </main>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handlePickImage(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {onShareChange && doc.share_token && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          shareToken={doc.share_token}
          shareRole={doc.share_role ?? "none"}
          onShareChange={onShareChange}
        />
      )}
    </div>
  );
}

async function saveToDevice(
  filename: string,
  content: string,
  type: string,
  accept: string[],
) {
  const picker = (window as unknown as {
    showSaveFilePicker?: (opts: unknown) => Promise<{
      createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  }).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: "Document", accept: { [type]: accept } }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([content], { type }));
      await writable.close();
      toast.success("Saved to your device");
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  download(filename, content, type);
  toast.success("Saved to your downloads");
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}
