# PRD.md — BarrIA (App Nativa MVP)

## 1. Visión

BarrIA es una app de navegación y seguridad predictiva impulsada por reportes de la comunidad, enfocada en Lima Norte (Comas, Los Olivos, San Martín de Porres, Independencia). El diferenciador central **no es la IA, es la capa de datos comunitarios**: vecinos reportando en tiempo real cómo está su calle/ruta, y la app usando eso para sugerir rutas más seguras y mantener informado al barrio.

**Principio de comunicación (aplica también dentro de la app, no solo en marketing):** problema primero, solución después. La app debe sentirse hecha *por y para* el barrio, no corporativa.

## 2. Usuarios objetivo

- **Comuneros/vecinos de Lima Norte** que se movilizan a pie o en transporte público y quieren saber si una ruta es segura antes de tomarla.
- **Contribuyentes de datos**: los mismos usuarios, reportando incidentes o condiciones de su ruta (iluminación, tensión, tranquilidad).
- **Primeros 500 usuarios de waitlist**: early adopters con acceso gratuito permanente como incentivo de lanzamiento.

## 3. Alcance del MVP (fecha límite: ~5 de septiembre de 2026)

Este NO es el MVP del Compartamos Impulsa — es un prototipo funcional para seguir iterando, con fecha ajustada.

### 3.1 Dentro del alcance

| # | Feature | Pantalla Figma (node-id) | Nivel de funcionalidad en MVP |
|---|---|---|---|
| 1 | Onboarding / Splash | `iPhone 16 - 1` (`125:199`) | Estático, marca BarrIA |
| 2 | Bienvenida (banner) | `Login Banner Page` (`49:136`) | CTA a login/signup/invitado |
| 3 | Login | `Login` (`25:126`) | Email + password vía Supabase Auth, + botón "Acceder como invitado" (crea sesión anónima) |
| 4 | Registro | `Signup Page` (`49:111`) | Crea cuenta vinculada a Supabase Auth anónimo existente (upgrade de anónimo a cuenta, no cuenta nueva desde cero) |
| 5 | Waitlist (primeros 500) | (no tiene pantalla propia aún — se agrega a Signup o banner) | Captura **email**, verificación **OTP**, checa cupo, marca `benefit_granted` |
| 6 | Home | `Home Page` (`19:64`) | Accesos rápidos "Ir a Casa/Universidad" (rutas guardadas por el usuario), botón "ENVIAR ALERTA", nav inferior (Inicio/Noticias/Otros) |
| 7 | Búsqueda de ruta | `Búsqueda de ruta Page` (`19:124`) | Input de destino + 3 modos de ruta: Buena iluminación / Comisarías Cerca / Balance Rápido y Seguro. **Cálculo real de distancia/tiempo sí; ponderación por seguridad real, NO todavía** (usa datos placeholder o heurística simple) |
| 8 | Ruta activa | `Ruta Activa Page` (`18:38`) | Mapa en vivo con ruta trazada, coloreado de tramos según reportes existentes en la zona (heurística simple: rojo/ámbar/verde por densidad de reportes), botones Finalizar/Cambiar Ruta |
| 9 | Reportar en ruta | `Reporte Page` (`18:49`) | Tags rápidos (iluminado / no iluminado / tenso / tranquilo) + descripción opcional + envío geolocalizado |
| 10 | Envío de emergencia | `Emergencia Envio Page` (`19:188`) + configuración de contactos (**UI propia, sin spec de Figma — ver decisions.md ADR-012**) | Al presionar "ENVIAR ALERTA" desde Home: muestra comisaría/hospital más cercano (vía PostGIS/datos estáticos) + botón llamar. Usuario puede configurar hasta 5 contactos de emergencia. El disparo real de notificación (SMS/WhatsApp) puede quedar simulado si el tiempo no alcanza |
| 11 | Noticias | `Noticias Page` (`97:344`) | Feed de noticias/avisos por zona, cargado desde tabla propia en Supabase (curado manual al inicio, no scraping automático) |
| 12 | BDA — Bóveda de Denuncias | `Comentarios Page` (`101:867`) — **confirmado** | Feed social de reportes por ubicación: likes, comentarios, flag |
| 13 | Rutas preestablecidas | Parte de Home (`19:64`) | Guardar "Casa" y otro destino frecuente (ej. "Universidad") como accesos directos |

### 3.2 Fuera de alcance para este MVP

- Cálculo de ruta ponderado por seguridad con modelo real (queda con heurística simple).
- Verificación de reportes (moderación comunitaria) — placeholder de `status` en DB pero sin flujo de UI todavía.
- Notificaciones push reales a contactos de emergencia.
- Publicación en App Store / Play Store (solo APK vía EAS Build).
- Panel B2B/B2G — no forma parte de la app de usuario final.
- Login social (Google/Facebook) — la UI de Figma lo contempla pero se implementa después si el tiempo alcanza.

## 4. Modelo de datos (v1 — sujeto a cambios, ver decisions.md ADR-004/005)

```sql
-- Usuarios: gestionados por Supabase Auth (auth.users), no se crea tabla propia de perfil público.

-- Zonas (para agregación y "cobertura mínima" por barrio)
zones (
  id uuid pk,
  name text,              -- "Comas", "Los Olivos", etc.
  boundary geography(Polygon)
)

-- Reportes de incidentes / condiciones de ruta
incident_reports (
  id uuid pk,
  user_id uuid references auth.users,  -- anónimo
  location geography(Point),
  zone_id uuid references zones,
  incident_type text,      -- 'iluminado' | 'no_iluminado' | 'tenso' | 'tranquilo' | otros a definir
  severity int,             -- 1-5, opcional en MVP
  description text,
  reported_at timestamptz default now(),
  status text default 'pendiente',  -- 'pendiente' | 'verificado' | 'descartado'
  verification_count int default 0
)

-- BDA: comentarios/interacción social sobre una ubicación o reporte
location_feed_posts (
  id uuid pk,
  user_id uuid references auth.users,
  location geography(Point),
  content text,
  category text,           -- 'restaurantes' | 'hospitales' | 'comisaria' | otros (según Figma)
  created_at timestamptz default now()
)

location_feed_reactions (
  id uuid pk,
  post_id uuid references location_feed_posts,
  user_id uuid references auth.users,
  reaction_type text        -- 'like' | 'flag'
)

-- Rutas guardadas por usuario (accesos rápidos en Home)
saved_routes (
  id uuid pk,
  user_id uuid references auth.users,
  label text,               -- "Casa", "Universidad"
  destination geography(Point),
  created_at timestamptz default now()  -- necesario para orden determinista en Home (evita orden arbitrario de Postgres)
)

-- Contactos de emergencia del usuario (Feature #10). NO estaba en el modelo v1;
-- se agrega como decisión (ver decisions.md ADR-016). Máximo 5 por usuario.
-- RLS owner-only (auth.uid() = user_id); user_id tiene DEFAULT auth.uid().
emergency_contacts (
  id uuid pk,
  user_id uuid references auth.users,
  name text,
  phone text,
  sort_order int default 0,
  created_at timestamptz default now()
)

-- Noticias (curadas manualmente al inicio)
news_items (
  id uuid pk,
  zone_id uuid references zones,
  title text,
  description text,
  image_url text,
  published_at timestamptz
)

-- Waitlist (desacoplada de auth, ver ADR-005)
waitlist_entries (
  id uuid pk,
  contact text,              -- email o teléfono, a confirmar
  created_at timestamptz default now(),
  benefit_granted boolean default false,
  claimed_by_user_id uuid references auth.users null
)
```

**Todas las tablas llevan RLS activado desde la primera migración (ADR-004).**

## 5. Flujos de usuario clave

1. **Primer uso:** Splash → Banner bienvenida → elige Invitado (sesión anónima creada automáticamente) o Login/Signup → Home.
2. **Reclamar beneficio waitlist:** en algún punto post-login, si el usuario tiene un contacto de waitlist pendiente, se le ofrece vincularlo a su sesión anónima.
3. **Buscar y seguir ruta segura:** Home → Búsqueda de ruta → elige modo → Ruta Activa (mapa coloreado) → llega o cambia de ruta → Finalizar.
4. **Reportar:** desde Ruta Activa o hub de reporte → tags rápidos + descripción → se guarda geolocalizado.
5. **Emergencia:** Home → ENVIAR ALERTA → pantalla de emergencia con comisaría/hospital cercano y opción de llamar.
6. **Explorar BDA/Noticias:** nav inferior → Noticias o BDA por ubicación.

## 6. Preguntas abiertas (a resolver antes o durante el desarrollo)

- Umbral mínimo de reportes por zona para considerarla "cubierta" (pendiente de decisión de producto, ya identificado en discusiones previas).
- Proveedor de SMS/WhatsApp para el disparo real de alertas de emergencia (fuera de alcance decidir ahora; MVP puede simular el envío).

## 7. Métricas de éxito del MVP (prototipo, no negocio)

- App instalable vía APK sin errores críticos en flujo principal (buscar ruta → ver mapa → reportar).
- Al menos 3 zonas de Lima Norte con datos base cargados (aunque sea semilla manual) para que el coloreado del mapa no se vea vacío en demo.
- Registro anónimo + waitlist funcionando end-to-end.

## 8. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-08-26 | Creación inicial, mapeo completo de pantallas Figma a features |
