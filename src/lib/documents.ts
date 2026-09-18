import { supabase } from "@/integrations/supabase/client";
import { normalizePageSetup, type PageSetup } from "@/lib/page-setup";

export type DocumentRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  plain_text: string;
  folder_id: string | null;
  is_favorite: boolean;
  share_token: string;
  share_role: string;
  page_setup: PageSetup;
  created_at: string;
  updated_at: string;
};

export type FolderRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export const documentsKey = ["documents"] as const;
export const foldersKey = ["folders"] as const;

export const UNTITLED = "Untitled Document";

function hydrate(row: Record<string, unknown>): DocumentRow {
  return {
    ...(row as unknown as DocumentRow),
    page_setup: normalizePageSetup(row["page_setup"]),
  };
}

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

export async function fetchDocuments(): Promise<DocumentRow[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(hydrate);
}

export async function fetchDocument(id: string): Promise<DocumentRow> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return hydrate(data);
}

export type SharedDocument = {
  id: string;
  title: string;
  content: string;
  plain_text: string;
  share_role: string;
  page_setup: PageSetup;
  updated_at: string;
};

export async function fetchSharedDocument(token: string): Promise<SharedDocument> {
  const { data, error } = await supabase.rpc("get_shared_document", { _token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("This share link is no longer available.");
  return { ...(row as SharedDocument), page_setup: normalizePageSetup(row.page_setup) };
}

export async function saveSharedDocument(
  token: string,
  patch: { title?: string; content?: string; plain_text?: string },
) {
  const { data, error } = await supabase.rpc("update_shared_document", {
    _token: token,
    _title: patch.title ?? "",
    _content: patch.content ?? "",
    _plain_text: patch.plain_text ?? "",
  });
  if (error) throw error;
  if (!data) throw new Error("You no longer have edit access to this document.");
}

export async function fetchFolders(): Promise<FolderRow[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FolderRow[];
}

export async function createDocument(input: {
  title?: string;
  content?: string;
  folder_id?: string | null;
  page_setup?: PageSetup;
}): Promise<DocumentRow> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      title: input.title ?? UNTITLED,
      content: input.content ?? "",
      plain_text: stripHtml(input.content ?? ""),
      folder_id: input.folder_id ?? null,
      ...(input.page_setup ? { page_setup: input.page_setup } : {}),
    })
    .select()
    .single();
  if (error) throw error;
  return hydrate(data);
}

export async function updateDocument(
  id: string,
  patch: Partial<Omit<DocumentRow, "page_setup">> & { page_setup?: PageSetup },
) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("documents")
    .update(patch as never)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteDocument(id: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function duplicateDocument(doc: DocumentRow) {
  return createDocument({
    title: `${doc.title} (copy)`,
    content: doc.content,
    folder_id: doc.folder_id,
    page_setup: doc.page_setup,
  });
}

export async function createFolder(name: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from("folders").insert({ user_id: userId, name });
  if (error) throw error;
}

export async function deleteFolder(id: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from("folders").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

const IMAGE_BUCKET = "document-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads an image picked from the device and returns a long-lived URL. */
export async function uploadDocumentImage(file: File): Promise<string> {
  const userId = await requireUserId();
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext || "png"}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || "image/png", upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Could not link the image.");
  return data.signedUrl;
}
