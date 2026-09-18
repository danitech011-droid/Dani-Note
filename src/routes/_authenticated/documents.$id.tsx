import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { EditorLoading } from "@/components/editor/EditorLoading";
import { documentsKey, fetchDocument, updateDocument } from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/documents/$id")({
  head: () => ({
    meta: [
      { title: "Editor — Dani-Note" },
      { name: "description", content: "Write and format your document in the Dani-Note editor." },
      { property: "og:title", content: "Editor — Dani-Note" },
      { property: "og:description", content: "Write and format your document in Dani-Note." },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => fetchDocument(id),
    retry: false,
  });

  if (isLoading) return <EditorLoading />;

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Document not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been deleted, or it belongs to another account.
          </p>
          <Button asChild className="mt-6 bg-brand-gradient shadow-brand">
            <Link to="/dashboard">Back to my documents</Link>
          </Button>
        </div>
      </div>
    );
  }

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["document", id] });
    await queryClient.invalidateQueries({ queryKey: documentsKey });
  };

  return (
    <DocumentEditor
      doc={data}
      onSave={async (patch) => {
        await updateDocument(id, patch);
        await queryClient.invalidateQueries({ queryKey: documentsKey });
      }}
      onToggleFavorite={async () => {
        await updateDocument(id, { is_favorite: !data.is_favorite });
        await invalidate();
      }}
      onShareChange={async (role) => {
        await updateDocument(id, { share_role: role });
        await invalidate();
      }}
      onPageSetupChange={async (setup) => {
        await updateDocument(id, { page_setup: setup });
        await invalidate();
      }}
    />
  );
}
