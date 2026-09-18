import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { EditorLoading } from "@/components/editor/EditorLoading";
import { fetchSharedDocument, saveSharedDocument } from "@/lib/documents";

export const Route = createFileRoute("/share/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shared document — Dani-Note" },
      { name: "description", content: "A document shared with you through Dani-Note." },
      { property: "og:title", content: "Shared document — Dani-Note" },
      { property: "og:description", content: "A document shared with you through Dani-Note." },
    ],
  }),
  component: SharedDoc,
});

function SharedDoc() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: () => fetchSharedDocument(token),
    retry: false,
  });

  if (isLoading) return <EditorLoading label="Opening shared document…" />;

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">This link isn't available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The document may have been unshared or deleted.
          </p>
        </div>
      </div>
    );
  }

  const canEdit = data.share_role === "editor";

  return (
    <DocumentEditor
      doc={{
        id: data.id,
        title: data.title,
        content: data.content,
        page_setup: data.page_setup,
      }}
      readOnly={!canEdit}
      onSave={async (patch) => {
        await saveSharedDocument(token, patch);
        await queryClient.invalidateQueries({ queryKey: ["shared", token] });
      }}
    />
  );
}
