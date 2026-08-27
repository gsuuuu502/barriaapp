-- Migración: función RPC nearby_incident_reports (reportes cercanos, sin user_id)
-- Devuelve reportes comunitarios dentro de un radio (metros) de una coordenada.
-- NO expone user_id (anonimato, ver ADR-005 y AGENT.md §5).

CREATE OR REPLACE FUNCTION public.nearby_incident_reports(
  lat double precision,
  long double precision,
  radius_m double precision DEFAULT 1000
)
RETURNS TABLE (
  id uuid,
  incident_type text,
  description text,
  severity int,
  reported_at timestamptz,
  distance_m double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ir.id,
    ir.incident_type,
    ir.description,
    ir.severity,
    ir.reported_at,
    ST_Distance(
      ir.location,
      ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography
    ) AS distance_m
  FROM public.incident_reports ir
  WHERE ST_DWithin(
    ir.location,
    ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
    radius_m
  )
  AND ir.status = 'pendiente'
  ORDER BY distance_m ASC;
$$;

-- Permisos: la función se ejecuta con SECURITY INVOKER por defecto; el SELECT
-- dentro queda gobernado por RLS (select_any = true). Exponer al rol anon/authenticated:
GRANT EXECUTE ON FUNCTION public.nearby_incident_reports(double precision, double precision, double precision) TO anon, authenticated;
