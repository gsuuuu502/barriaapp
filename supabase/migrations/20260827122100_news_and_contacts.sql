-- Migración: news_items + emergency_contacts (Features #11 y #10)
--
-- news_items (Feature #11): feed de noticias/avisos curado manualmente.
--   - contenido público para todos (select_any USING(true)); solo lectura para anon/auth.
--   - sin políticas de escritura públicas (el curado lo hace el dueño/rol de la tabla,
--     no el user anónimo).
--   - zone_id queda NULL sin FK porque la tabla zones aún no existe (igual que incident_reports).
--
-- emergency_contacts (Feature #10): contactos de emergencia del usuario (hasta 5).
--   - NO está en el modelo PRD v1; se agrega como decisión (ver decisions.md ADR-016).
--   - RLS owner-only: cada usuario anónimo/autenticado solo ve y edita los suyos
--     (auth.uid() = user_id). El teléfono/contacto es PII del propio dueño, nunca
--     se expone a otros.

CREATE TABLE public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid,                      -- referencia futura a zones (aún no existe tabla)
  title text NOT NULL,
  description text,
  image_url text,
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX news_items_published_idx ON public.news_items (published_at DESC);

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY news_items_select_any ON public.news_items
  FOR SELECT USING (true);

CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  name text NOT NULL,
  phone text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX emergency_contacts_user_idx ON public.emergency_contacts (user_id, sort_order);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_contacts_select_own ON public.emergency_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY emergency_contacts_insert_own ON public.emergency_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY emergency_contacts_update_own ON public.emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY emergency_contacts_delete_own ON public.emergency_contacts
  FOR DELETE USING (auth.uid() = user_id);
