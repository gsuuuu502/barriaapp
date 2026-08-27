-- Semilla inicial de noticias curadas (Feature #11). Contentido de ejemplo para el MVP/demo.
-- zone_id queda NULL hasta que exista la tabla zones. Es idempotente por título.

INSERT INTO public.news_items (title, description, image_url, published_at) VALUES
  (
    'Nuevos puntos de iluminación en Comas',
    'Se reportó la instalación de nuevas luminarias en el tramo que conecta la Av. Tupac Amaru con la zona residencial. Se recomienda extremar precauciones en horario nocturno.',
    NULL,
    now() - interval '2 hours'
  ),
  (
    'Campaña vecinal de seguridad en Los Olivos',
    'La junta vecinal organiza rondas nocturnas coordinadas con la comisaría del sector. Los vecinos pueden sumarse desde la BDA de la app.',
    NULL,
    now() - interval '1 day'
  ),
  (
    'Recordatorio: reporta condiciones de tu ruta',
    'Usa el botón "Reportar" en Ruta Activa para marcar zonas sin iluminación o de riesgo. Los reportes alimentan el mapa comunitario.',
    NULL,
    now() - interval '2 days'
  )
ON CONFLICT DO NOTHING;
