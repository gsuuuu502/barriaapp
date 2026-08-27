-- Migración: saved_routes — tabla + columna created_at + RLS por usuario
-- Contexto: la tabla NO existía en Supabase al momento de aplicar. Esta migración
-- la crea completa (con created_at) e idempotente. Activa RLS y crea políticas para
-- que cada usuario solo vea/modifique sus propias filas (anonimato, ver ADR-005).

-- 0. PostGIS para la columna geography(Point) (ADR-004: activado desde el día 1)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Crear la tabla (si no existe) con created_at incluido
CREATE TABLE IF NOT EXISTS public.saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id),
  label text NOT NULL,
  destination geography(Point) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Asegurar RLS activado
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas: cada usuario solo accede a sus propias filas (auth.uid() = user_id)

-- SELECT: ver solo sus propias rutas guardadas
DROP POLICY IF EXISTS "saved_routes_select_own" ON public.saved_routes;
CREATE POLICY "saved_routes_select_own"
  ON public.saved_routes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: insertar solo con su propio user_id
DROP POLICY IF EXISTS "saved_routes_insert_own" ON public.saved_routes;
CREATE POLICY "saved_routes_insert_own"
  ON public.saved_routes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: modificar solo sus propias filas
DROP POLICY IF EXISTS "saved_routes_update_own" ON public.saved_routes;
CREATE POLICY "saved_routes_update_own"
  ON public.saved_routes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: eliminar solo sus propias filas
DROP POLICY IF EXISTS "saved_routes_delete_own" ON public.saved_routes;
CREATE POLICY "saved_routes_delete_own"
  ON public.saved_routes
  FOR DELETE
  USING (auth.uid() = user_id);
