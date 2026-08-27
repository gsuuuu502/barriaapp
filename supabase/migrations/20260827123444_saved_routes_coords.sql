-- Migración: saved_routes — columnas numéricas de coordenadas + user_id DEFAULT
--
-- Contexto (Feature #13): los accesos rápidos del Home deben iniciar navegación
-- real hacia las coordenadas. La columna destination geography(Point) devuelve
-- EWKB vía PostgREST (no lat/lng legibles), así que se agregan columnas numéricas
-- destination_lat/destination_lng que la app lee/escribe directamente.
-- También se da DEFAULT auth.uid() a user_id (misma intención que emergency_contacts,
-- ADR-016): el servidor fija el dueño; RLS (WITH CHECK auth.uid() = user_id) sigue
-- exigiendo que coincida.

ALTER TABLE public.saved_routes
  ADD COLUMN IF NOT EXISTS destination_lat double precision,
  ADD COLUMN IF NOT EXISTS destination_lng double precision;

ALTER TABLE public.saved_routes
  ALTER COLUMN user_id SET DEFAULT auth.uid();
