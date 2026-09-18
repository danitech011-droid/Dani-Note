import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  FolderOpen,
  Share2,
  FileText,
  Shield,
  Wand2,
  Check,
} from "lucide-react";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dani-Note — Write, organise and share documents" },
      {
        name: "description",
        content:
          "A premium document workspace: Word-class rich text editing, folders, favourites, instant search, export, sharing and an AI writing assistant.",
      },
      { property: "og:title", content: "Dani-Note — Write, organise and share documents" },
      {
        property: "og:description",
        content:
          "Word-class rich text editing, folders, favourites, export, sharing and an AI writing assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Professional editor",
    body: "Headings, fonts, colours, highlights, tables, images and true A4 page layout.",
  },
  {
    icon: FolderOpen,
    title: "Organised workspace",
    body: "Folders, favourites, grid or list view, sorting and instant full-text search.",
  },
  {
    icon: Wand2,
    title: "AI writing assistant",
    body: "Improve, correct, rewrite, summarise, continue and translate — inside the page.",
  },
  {
    icon: Share2,
    title: "Export & share",
    body: "PDF, DOCX or TXT export, print-ready output and links with viewer or editor rights.",
  },
];

const HIGHLIGHTS = [
  "Autosave with manual save control",
  "A4, A5, Letter and Legal page setup",
  "Light, dark and system themes",
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)))
      .catch((error) => console.error("Supabase session is unavailable:", error));
  }, []);

  const primaryTo = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 glass-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Wordmark size={32} />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-brand-gradient px-4 shadow-brand transition-transform active:scale-95"
            >
              <Link to={primaryTo}>{signedIn ? "Open workspace" : "Get started"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="aura relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-faint" />
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center md:pb-24 md:pt-24">
            <div className="animate-rise flex justify-center">
              <Logo size={72} className="shadow-brand" />
            </div>

            <p className="animate-rise eyebrow mt-7 text-muted-foreground">
              The document workspace
            </p>
            <h1 className="animate-rise display-tight mx-auto mt-3 max-w-4xl text-[2.5rem] font-bold md:text-[4rem]">
              Write documents that feel{" "}
              <span className="text-brand-gradient">effortlessly premium</span>
            </h1>
            <p className="animate-rise mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-lg">
              A Word-class writing canvas, an elegant document library and an AI assistant — united
              in one calm, fast workspace.
            </p>

            <div className="animate-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-brand-gradient px-7 shadow-brand transition-transform active:scale-95 sm:w-auto"
              >
                <Link to={primaryTo}>
                  {signedIn ? "Open workspace" : "Start writing free"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-full border-border/70 px-7 sm:w-auto"
              >
                <Link to="/auth">Create an account</Link>
              </Button>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Private by default — your documents are yours alone.
            </p>

            {/* Paper preview */}
            <div className="animate-rise relative mx-auto mt-14 max-w-3xl">
              <div className="absolute inset-x-8 -bottom-4 h-24 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl hairline bg-card shadow-elevate">
                <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-3 truncate text-xs text-muted-foreground">
                    Quarterly Report — Dani-Note
                  </span>
                </div>
                <div className="bg-muted/40 p-5 sm:p-8">
                  <div className="mx-auto max-w-md rounded-md bg-card p-6 text-left shadow-page sm:p-9">
                    <div className="h-2.5 w-2/3 rounded-full bg-brand-gradient opacity-80" />
                    <div className="mt-5 space-y-2.5">
                      {[100, 92, 96, 70, 88, 60].map((w, i) => (
                        <div
                          key={i}
                          className="h-2 rounded-full bg-muted-foreground/15"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-6 h-14 rounded-lg bg-brand-gradient-soft" />
                    <div className="mt-5 space-y-2.5">
                      {[95, 80, 64].map((w, i) => (
                        <div
                          key={i}
                          className="h-2 rounded-full bg-muted-foreground/15"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="max-w-xl">
            <p className="eyebrow text-primary">Everything included</p>
            <h2 className="display-tight mt-3 text-3xl font-bold md:text-4xl">
              Crafted for serious writing
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Every detail — from typography to page setup — is tuned so your documents look
              considered before you write a word.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl hairline bg-border/60 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-card p-7 transition-colors duration-300 hover:bg-accent/40"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-brand transition-transform duration-300 group-hover:-translate-y-0.5">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient-soft">
                  <Check className="h-3 w-3 text-primary" />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-7 py-14 text-center text-primary-foreground shadow-brand md:px-12 md:py-20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />
            <Sparkles className="mx-auto h-6 w-6 opacity-90" />
            <h2 className="display-tight mt-5 text-3xl font-bold md:text-4xl">
              Your next document starts here
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm opacity-90 md:text-base">
              Turn scattered notes into polished, shareable documents in minutes.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-7 rounded-full px-7">
              <Link to={primaryTo}>{signedIn ? "Open workspace" : "Get started free"}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
          <Wordmark size={26} />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dani-Note. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
