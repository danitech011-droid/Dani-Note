import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runAiAssistant } from "@/lib/ai.functions";

const ACTIONS = [
  { id: "improve", label: "Improve writing" },
  { id: "grammar", label: "Fix grammar" },
  { id: "rewrite", label: "Rewrite" },
  { id: "summarize", label: "Summarise" },
  { id: "ideas", label: "Generate ideas" },
  { id: "continue", label: "Continue writing" },
] as const;

export function AiAssistant({
  getSelection,
  onInsert,
  onClose,
}: {
  getSelection: () => string;
  onInsert: (html: string) => void;
  onClose: () => void;
}) {
  const run = useServerFn(runAiAssistant);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("French");

  async function handle(action: string) {
    const text = getSelection();
    if (!text.trim()) {
      toast.error("Write something first, or select text to work on.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await run({
        data: { action, text, ...(action === "translate" ? { language } : {}) },
      } as never);
      setResult((res as { content: string }).content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The AI assistant failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="hidden w-80 shrink-0 lg:block">
      <div className="sticky top-40 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI assistant
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close AI panel">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-1.5">
          {ACTIONS.map((a) => (
            <Button
              key={a.id}
              variant="outline"
              size="sm"
              className="justify-start"
              disabled={loading}
              onClick={() => handle(a.id)}
            >
              {a.label}
            </Button>
          ))}
          <div className="mt-1 flex gap-1.5">
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-9"
              aria-label="Translation language"
            />
            <Button size="sm" disabled={loading} onClick={() => handle("translate")}>
              Translate
            </Button>
          </div>
        </div>

        {loading && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </p>
        )}

        {result && (
          <div className="mt-4">
            <div
              className="doc-canvas max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-sm"
              dangerouslySetInnerHTML={{ __html: result }}
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-brand-gradient"
                onClick={() => {
                  onInsert(result);
                  setResult("");
                }}
              >
                Insert
              </Button>
              <Button size="sm" variant="outline" onClick={() => setResult("")}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
