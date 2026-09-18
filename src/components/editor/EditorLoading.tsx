import { Logo } from "@/components/brand/Logo";

export function EditorLoading({ label = "Loading your document…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-muted/40 px-6">
      <Logo size={60} className="animate-pulse shadow-brand" />
      <div className="w-full max-w-[520px] space-y-3">
        <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
