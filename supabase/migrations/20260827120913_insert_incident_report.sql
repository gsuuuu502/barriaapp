-- Migración: función RPC insert_incident_report
-- Inserta un reporte de incidente construyendo la geography(Point) correctamente.
-- Problema resuelto: PostgREST no convierte GeoJSON a geography(Point) automáticamente
-- (error "invalid geometry"). Esta función usa ST_SetSRID(ST_MakePoint(...))::geography.
--
-- Corre con SECURITY INVOKER → el INSERT interno queda gobernado por RLS
-- (política incident_reports_insert_own: WITH CHECK (auth.uid() = user_id)),
-- así que un usuario anónimo/autenticado solo puede insertar a su propio user_id.

CREATE OR REPLACE FUNCTION public.insert_incident_report(
  long double precision,
  lat double precision,
  incident_type text,
  description text DEFAULT NULL,
  severity int DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
VOLATILE
SECURITY INVOKER
AS $$
  INSERT INTO public.incident_reports (
    user_id,
    location,
    incident_type,
    description,
    severity
  )
  VALUES (
    auth.uid(),
    ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
    incident_type,
    description,
    severity
  )
  RETURNING id;
$$;

-- Permitir la invocación vía API anónima/autenticada (RLS sigue protegiendo el INSERT interno).
GRANT EXECUTE ON FUNCTION public.insert_incident_report(double precision, double precision, text, text, int) TO anon, authenticated;
