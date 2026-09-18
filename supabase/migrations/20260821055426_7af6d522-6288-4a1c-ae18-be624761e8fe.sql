-- 1. Remove broad share policies that leaked documents across accounts
DROP POLICY IF EXISTS "shared documents readable" ON public.documents;
DROP POLICY IF EXISTS "shared documents editable" ON public.documents;
DROP POLICY IF EXISTS "own documents" ON public.documents;

CREATE POLICY "documents select own" ON public.documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "documents insert own" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents update own" ON public.documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents delete own" ON public.documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

-- 2. Page setup per document
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS page_setup jsonb NOT NULL
  DEFAULT '{"size":"A4","orientation":"portrait","margin":"normal"}'::jsonb;

-- 3. Token-scoped share access (no table-wide anon access)
CREATE OR REPLACE FUNCTION public.get_shared_document(_token uuid)
RETURNS TABLE (
  id uuid, title text, content text, plain_text text,
  share_role text, page_setup jsonb, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.title, d.content, d.plain_text, d.share_role, d.page_setup, d.updated_at
  FROM public.documents d
  WHERE d.share_token = _token
    AND d.share_role IN ('viewer', 'editor');
$$;

CREATE OR REPLACE FUNCTION public.update_shared_document(
  _token uuid, _title text, _content text, _plain_text text
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated int;
BEGIN
  UPDATE public.documents d
  SET title = COALESCE(NULLIF(btrim(_title), ''), d.title),
      content = _content,
      plain_text = _plain_text
  WHERE d.share_token = _token AND d.share_role = 'editor';
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_document(uuid) FROM public;
REVOKE ALL ON FUNCTION public.update_shared_document(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_document(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_shared_document(uuid, text, text, text) TO anon, authenticated;