-- Migración: incident_reports — tabla + RLS (incluye usuarios anónimos, ADR-005)
-- La tabla no existía en Supabase al momento de aplicar; se crea completa.
-- RLS: INSERT a nombre del usuario autenticado (incluye anónimos); SELECT público
-- para el mapa comunitario (la app NO debe exponer user_id crudo en UI);
-- UPDATE/DELETE solo del dueño.

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tabla (idempotente)
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id),
  location geography(Point) NOT NULL,
  -- zone_id: opcional en MVP; si la tabla zones existe se puede agregar FK luego
  zone_id uuid NULL,
  incident_type text NOT NULL, -- 'iluminado' | 'no_iluminado' | 'tenso' | 'tranquilo'
  severity int NULL,           -- 1-5, opcional en MVP
  description text NULL,
  reported_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'verificado' | 'descartado'
  verification_count int NOT NULL DEFAULT 0
);

-- 2. RLS activado
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- 3. Políticas

-- INSERT: cualquier usuario autenticado (incl. anónimos) inserta SOLO a su nombre
DROP POLICY IF EXISTS "incident_reports_insert_own" ON public.incident_reports;
CREATE POLICY "incident_reports_insert_own"
  ON public.incident_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SELECT: los reportes son comunitarios; cualquiera los lee (sin user_id en la UI)
DROP POLICY IF EXISTS "incident_reports_select_any" ON public.incident_reports;
CREATE POLICY "incident_reports_select_any"
  ON public.incident_reports
  FOR SELECT
  USING (true);

-- UPDATE: solo el autor puede modificar su propio reporte
DROP POLICY IF EXISTS "incident_reports_update_own" ON public.incident_reports;
CREATE POLICY "incident_reports_update_own"
  ON public.incident_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: solo el autor puede eliminar su propio reporte
DROP POLICY IF EXISTS "incident_reports_delete_own" ON public.incident_reports;
CREATE POLICY "incident_reports_delete_own"
  ON public.incident_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Índice geoespacial para "reportes cercanos" (St_DWithin / St_Distance)
DROP INDEX IF EXISTS incident_reports_location_gist;
CREATE INDEX incident_reports_location_gist
  ON public.incident_reports
  USING GIST (location);
