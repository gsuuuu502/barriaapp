-- Migración: BDA — location_feed_posts + location_feed_reactions
-- Feed social / bóveda de denuncias (Feature #12, PRD §3.1).
--
-- Diseño RLS (sesiones anónimas, ADR-005):
--   * Las tablas SIEMPRE tienen RLS activo.
--   * Lectura (SELECT) es comunitaria: USING(true); la proyección a la UI pasa por
--     una view que NO expone user_id crudo (anonimato).
--   * Inserción: el user_id se fija dentro de una función SECURITY INVOKER con
--     auth.uid(), y la política insert_own exige WITH CHECK (auth.uid() = user_id).
--   * Reacciones (like/flag): única por (post_id, user_id, reaction_type); el toggle
--     se resuelve en una función RPC con delete/insert del propio usuario.
--
-- Las columnas geography(Point) NO aceptan GeoJSON vía PostgREST (error "invalid
-- geometry"), por eso la inserción construye el punto con
-- ST_SetSRID(ST_MakePoint(...),4326)::geography dentro de funciones RPC.

CREATE TABLE public.location_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  location geography(Point) NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX location_feed_posts_created_at_idx ON public.location_feed_posts (created_at DESC);

ALTER TABLE public.location_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY location_feed_posts_select_any ON public.location_feed_posts
  FOR SELECT USING (true);
CREATE POLICY location_feed_posts_insert_own ON public.location_feed_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY location_feed_posts_delete_own ON public.location_feed_posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.location_feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.location_feed_posts ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'flag')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX location_feed_reactions_post_idx ON public.location_feed_reactions (post_id);

ALTER TABLE public.location_feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY location_feed_reactions_select_any ON public.location_feed_reactions
  FOR SELECT USING (true);
CREATE POLICY location_feed_reactions_insert_own ON public.location_feed_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY location_feed_reactions_delete_own ON public.location_feed_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- View del feed: agrega contadores sin exponer user_id.
CREATE OR REPLACE VIEW public.location_feed_view AS
SELECT
  p.id,
  p.location,
  p.content,
  p.category,
  p.created_at,
  COALESCE(lc.like_count, 0)::int AS like_count,
  COALESCE(fc.flag_count, 0)::int AS flag_count
FROM public.location_feed_posts p
LEFT JOIN (
  SELECT post_id, count(*) AS like_count
  FROM public.location_feed_reactions
  WHERE reaction_type = 'like'
  GROUP BY post_id
) lc ON lc.post_id = p.id
LEFT JOIN (
  SELECT post_id, count(*) AS flag_count
  FROM public.location_feed_reactions
  WHERE reaction_type = 'flag'
  GROUP BY post_id
) fc ON fc.post_id = p.id
ORDER BY p.created_at DESC;

-- RPC: crear post (geografía + user_id interno, RLS insert_own se aplica).
CREATE OR REPLACE FUNCTION public.create_location_feed_post(
  long double precision,
  lat double precision,
  content text,
  category text
)
RETURNS uuid
LANGUAGE sql
VOLATILE
SECURITY INVOKER
AS $$
  INSERT INTO public.location_feed_posts (user_id, location, content, category)
  VALUES (
    auth.uid(),
    ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
    content,
    category
  )
  RETURNING id;
$$;

-- RPC: alternar reacción (like/flag). Inserta si no existía, borra si ya existía.
CREATE OR REPLACE FUNCTION public.toggle_location_feed_reaction(
  target_post_id uuid,
  target_type text
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
AS $$
DECLARE
  existing uuid;
  now_reacted boolean;
BEGIN
  SELECT id INTO existing
  FROM public.location_feed_reactions
  WHERE post_id = target_post_id
    AND user_id = auth.uid()
    AND reaction_type = target_type;

  IF existing IS NOT NULL THEN
    DELETE FROM public.location_feed_reactions WHERE id = existing;
    now_reacted := false;
  ELSE
    INSERT INTO public.location_feed_reactions (post_id, user_id, reaction_type)
    VALUES (target_post_id, auth.uid(), target_type);
    now_reacted := true;
  END IF;

  RETURN now_reacted;
END;
$$;

GRANT SELECT ON public.location_feed_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_location_feed_post(double precision, double precision, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_location_feed_reaction(uuid, text) TO anon, authenticated;
