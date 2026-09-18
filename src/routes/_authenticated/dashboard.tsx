import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Star,
  LayoutGrid,
  List as ListIcon,
  Folder,
  FolderPlus,
  MoreVertical,
  Trash2,
  Copy,
  Pencil,
  FileText,
  LogOut,
  Clock,
  Menu,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  createDocument,
  createFolder,
  deleteDocument,
  deleteFolder,
  documentsKey,
  duplicateDocument,
  fetchDocuments,
  fetchFolders,
  foldersKey,
  updateDocument,
  type DocumentRow,
} from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My documents — Dani-Note" },
      { name: "description", content: "Browse, search and organise all of your Dani-Note documents." },
      { property: "og:title", content: "My documents — Dani-Note" },
      { property: "og:description", content: "Your Dani-Note document workspace." },
    ],
  }),
  component: Dashboard,
});

type Filter = { kind: "all" | "recent" | "favorites" | "folder"; folderId?: string };

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"updated" | "created" | "title">("updated");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [navOpen, setNavOpen] = useState(false);

  const docsQuery = useQuery({ queryKey: documentsKey, queryFn: fetchDocuments });
  const foldersQuery = useQuery({ queryKey: foldersKey, queryFn: fetchFolders });

  const docs = useMemo(() => {
    let list = docsQuery.data ?? [];
    if (filter.kind === "favorites") list = list.filter((d) => d.is_favorite);
    if (filter.kind === "folder") list = list.filter((d) => d.folder_id === filter.folderId);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) => d.title.toLowerCase().includes(q) || d.plain_text.toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "created") return b.created_at.localeCompare(a.created_at);
      return b.updated_at.localeCompare(a.updated_at);
    });
    return filter.kind === "recent" ? sorted.slice(0, 8) : sorted;
  }, [docsQuery.data, filter, query, sort]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: documentsKey });

  async function handleNew() {
    try {
      const doc = await createDocument({
        folder_id: filter.kind === "folder" ? (filter.folderId ?? null) : null,
      });
      await refresh();
      navigate({ to: "/documents/$id", params: { id: doc.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create document");
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const workspaceNav = (
    <div>
      <nav className="space-y-1">
        <SideItem
          icon={FileText}
          label="All documents"
          active={filter.kind === "all"}
          onClick={() => setFilter({ kind: "all" })}
        />
        <SideItem
          icon={Clock}
          label="Recent"
          active={filter.kind === "recent"}
          onClick={() => setFilter({ kind: "recent" })}
        />
        <SideItem
          icon={Star}
          label="Favourites"
          active={filter.kind === "favorites"}
          onClick={() => setFilter({ kind: "favorites" })}
        />
      </nav>

      <div className="mt-6 mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Folders
        <button
          aria-label="New folder"
          className="rounded-md p-1 transition-colors hover:bg-accent"
          onClick={async () => {
            const name = window.prompt("Folder name");
            if (!name) return;
            await createFolder(name);
            void queryClient.invalidateQueries({ queryKey: foldersKey });
          }}
        >
          <FolderPlus className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-1">
        {(foldersQuery.data ?? []).map((f) => (
          <div key={f.id} className="group flex min-w-0 items-center">
            <SideItem
              icon={Folder}
              label={f.name}
              active={filter.kind === "folder" && filter.folderId === f.id}
              onClick={() => setFilter({ kind: "folder", folderId: f.id })}
            />
            <button
              aria-label={`Delete folder ${f.name}`}
              className="ml-1 shrink-0 rounded-md p-1 opacity-60 transition hover:bg-accent md:opacity-0 md:group-hover:opacity-100"
              onClick={async () => {
                await deleteFolder(f.id);
                setFilter({ kind: "all" });
                void queryClient.invalidateQueries({ queryKey: foldersKey });
                void refresh();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
        {foldersQuery.data?.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">No folders yet.</p>
        )}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-30 border-b border-border/60 glass-panel">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-1">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 md:hidden"
                  aria-label="Open workspace menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[17rem] p-0">
                <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
                  <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
                  <Wordmark size={30} />
                </SheetHeader>
                <div
                  className="overflow-y-auto px-3 py-4"
                  onClick={() => setNavOpen(false)}
                  role="presentation"
                >
                  {workspaceNav}
                </div>
              </SheetContent>
            </Sheet>
            <span className="hidden sm:inline-flex">
              <Wordmark size={32} />
            </span>
            <span className="sm:hidden">
              <Wordmark size={28} showText={false} />
            </span>
          </div>

          <div className="relative hidden min-w-0 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="mx-auto max-w-md rounded-full border-border/70 pl-9"
              aria-label="Search documents"
            />
          </div>
          <div className="md:hidden" />

          <div className="flex shrink-0 items-center gap-1 justify-self-end sm:gap-1.5">
            <Button
              onClick={handleNew}
              size="sm"
              className="rounded-full bg-brand-gradient px-3 shadow-brand transition-transform active:scale-95 sm:px-4"
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-3 pb-2.5 sm:px-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="rounded-full border-border/70 pl-9"
              aria-label="Search documents"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-5 sm:px-4 sm:py-6">
        <aside className="hidden w-56 shrink-0 md:block">{workspaceNav}</aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
            <h1 className="display-tight min-w-0 truncate text-xl font-bold sm:mr-auto sm:text-2xl md:text-[1.75rem]">
              {filter.kind === "favorites"
                ? "Favourites"
                : filter.kind === "recent"
                  ? "Recent documents"
                  : filter.kind === "folder"
                    ? (foldersQuery.data?.find((f) => f.id === filter.folderId)?.name ?? "Folder")
                    : "All documents"}
            </h1>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="order-2 h-9 w-full rounded-full border-border/70 text-xs sm:order-none sm:w-[150px] sm:text-sm" aria-label="Sort documents">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last modified</SelectItem>
                <SelectItem value="created">Date created</SelectItem>
                <SelectItem value="title">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex shrink-0 rounded-full border border-border/70 p-0.5">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="Grid view"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="List view"
                onClick={() => setView("list")}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {docsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="animate-rise rounded-2xl border border-dashed border-border bg-card p-10 text-center sm:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient-soft">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">
                {query.trim()
                  ? "No documents match your search"
                  : filter.kind === "favorites"
                    ? "No favourites yet"
                    : "Your workspace is empty"}
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                {query.trim()
                  ? "Try a different word, or start a new document."
                  : "Every document you create is private to your account. Start your first one and it will appear here."}
              </p>
              <Button onClick={handleNew} className="mt-5 bg-brand-gradient shadow-brand">
                <Plus className="mr-1.5 h-4 w-4" /> New document
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                view === "grid" ? "grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3" : "space-y-2",
              )}
            >
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  view={view}
                  folders={foldersQuery.data ?? []}
                  onChanged={refresh}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SideItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-brand-gradient text-primary-foreground shadow-brand"
          : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function DocCard({
  doc,
  view,
  folders,
  onChanged,
}: {
  doc: DocumentRow;
  view: "grid" | "list";
  folders: { id: string; name: string }[];
  onChanged: () => void;
}) {
  const preview = doc.plain_text.slice(0, 160);
  const updated = new Date(doc.updated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Document actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            const title = window.prompt("Rename document", doc.title);
            if (!title) return;
            await updateDocument(doc.id, { title });
            onChanged();
          }}
        >
          <Pencil className="mr-2 h-4 w-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await updateDocument(doc.id, { is_favorite: !doc.is_favorite });
            onChanged();
          }}
        >
          <Star className="mr-2 h-4 w-4" />
          {doc.is_favorite ? "Remove favourite" : "Add to favourites"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await duplicateDocument(doc);
            onChanged();
            toast.success("Document duplicated");
          }}
        >
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Folder className="mr-2 h-4 w-4" /> Move to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={async () => {
                await updateDocument(doc.id, { folder_id: null });
                onChanged();
              }}
            >
              No folder
            </DropdownMenuItem>
            {folders.map((f) => (
              <DropdownMenuItem
                key={f.id}
                onClick={async () => {
                  await updateDocument(doc.id, { folder_id: f.id });
                  onChanged();
                }}
              >
                {f.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={async () => {
            if (!window.confirm(`Delete “${doc.title}”?`)) return;
            await deleteDocument(doc.id);
            onChanged();
            toast.success("Document deleted");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (view === "list") {
    return (
      <div className="flex items-center gap-3 rounded-xl hairline bg-card px-4 py-3 shadow-soft transition-all hover:border-primary/40 hover:shadow-elevate">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient-soft">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <Link
          to="/documents/$id"
          params={{ id: doc.id }}
          className="min-w-0 flex-1"
        >
          <p className="truncate font-medium">{doc.title}</p>
          <p className="truncate text-xs text-muted-foreground">{updated}</p>
        </Link>
        {doc.is_favorite && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
        {menu}
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl hairline bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevate">
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient-soft">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-center">
          {doc.is_favorite && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
          {menu}
        </div>
      </div>
      <Link to="/documents/$id" params={{ id: doc.id }} className="block">
        <h3 className="truncate font-semibold">{doc.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
          {preview || "Empty document"}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{updated}</p>
      </Link>
    </div>
  );
}
