-- Dani-Note database setup for a new Supabase project.
-- Run this entire file once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'indigo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled document',
  content TEXT NOT NULL DEFAULT '',
  plain_text TEXT NOT NULL DEFAULT '',
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  share_role TEXT NOT NULL DEFAULT 'none',
  page_setup JSONB NOT NULL DEFAULT '{"size":"A4","orientation":"portrait","margin":"normal"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS page_setup JSONB NOT NULL DEFAULT '{"size":"A4","orientation":"portrait","margin":"normal"}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS documents_share_token_idx ON public.documents(share_token);
CREATE INDEX IF NOT EXISTS documents_user_updated_idx ON public.documents(user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.profiles, public.folders, public.documents TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "own folders" ON public.folders;
CREATE POLICY "own folders" ON public.folders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own documents" ON public.documents;
DROP POLICY IF EXISTS "shared documents readable" ON public.documents;
DROP POLICY IF EXISTS "shared documents editable" ON public.documents;
DROP POLICY IF EXISTS "documents select own" ON public.documents;
DROP POLICY IF EXISTS "documents insert own" ON public.documents;
DROP POLICY IF EXISTS "documents update own" ON public.documents;
DROP POLICY IF EXISTS "documents delete own" ON public.documents;
CREATE POLICY "documents select own" ON public.documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "documents insert own" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents update own" ON public.documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents delete own" ON public.documents FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.documents FROM anon;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.get_shared_document(_token uuid)
RETURNS TABLE (id uuid, title text, content text, plain_text text, share_role text, page_setup jsonb, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.title, d.content, d.plain_text, d.share_role, d.page_setup, d.updated_at
  FROM public.documents d WHERE d.share_token = _token AND d.share_role IN ('viewer','editor');
$$;

CREATE OR REPLACE FUNCTION public.update_shared_document(_token uuid, _title text, _content text, _plain_text text)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE updated int;
BEGIN
  UPDATE public.documents d SET title = COALESCE(NULLIF(btrim(_title), ''), d.title), content = _content, plain_text = _plain_text
  WHERE d.share_token = _token AND d.share_role = 'editor';
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END; $$;

REVOKE ALL ON FUNCTION public.get_shared_document(uuid) FROM public;
REVOKE ALL ON FUNCTION public.update_shared_document(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_document(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_shared_document(uuid, text, text, text) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public) VALUES ('document-images', 'document-images', false)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Users read own document images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own document images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own document images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own document images" ON storage.objects;
CREATE POLICY "Users read own document images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'document-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own document images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'document-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own document images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'document-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own document images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'document-images' AND auth.uid()::text = (storage.foldername(name))[1]);
