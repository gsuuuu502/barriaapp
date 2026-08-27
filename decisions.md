# decisions.md — BarrIA App

> Registro de decisiones de arquitectura (ADR). Cada decisión tiene un estado, el contexto que la motivó, la decisión tomada, y las consecuencias/trade-offs aceptados.
> **Regla para el agente (OpenCode):** si vas a tomar una decisión que contradiga o modifique algo aquí, PARA y pregunta a Jhostin antes de codear. No reinterpretes estas decisiones en silencio.

---

## ADR-001: Plataforma — React Native (Expo) con salida web como pre-experiencia

**Estado:** Aceptado

**Contexto:** Se necesita un prototipo nativo instalable (APK) para el 5 de septiembre, sin depender de aprobación de tiendas. También se quiere una "pre-experiencia" tipo PWA para que la gente pruebe la idea sin instalar nada.

**Decisión:**
- Framework: **Expo (React Native) con Expo Router**.
- Build nativo vía **EAS Build** → APK directo (perfil `preview`), sin publicar en Play Store por ahora.
- La "pre-experiencia PWA" se logra con `expo export --platform web`: es una versión web ligera de **onboarding/landing informativo**, NO la app funcional completa (mapa, reportes). Ver ADR-002 para el límite exacto.
- Un solo repo, un solo codebase. No se mantienen dos proyectos de UI en paralelo.

**Consecuencias:**
- (+) Un agente de código trabaja sobre un solo stack, reduce errores de "se rompió en la otra versión".
- (+) Expo simplifica permisos de geolocalización, notificaciones, y build sin configurar Xcode/Android Studio manualmente.
- (−) react-native-maps + tiles OSM tiene más fricción que Google Maps nativo (ver ADR-003).
- (−) La versión web de Expo no es 100% igual a la nativa en componentes de mapa (mitigado limitando el alcance de la web, ver ADR-002).

---

## ADR-002: Alcance de la "pre-experiencia PWA"

**Estado:** Aceptado

**Contexto:** Jhostin confirmó Opción A: la web es para "probar la idea" antes de instalar el APK, no una app completa en navegador.

**Decisión:** La build web de Expo solo expone:
- Splash / pantalla de marca (`iPhone 16 - 1`, node `125:199`)
- Login Banner / onboarding (`49:136`)
- Registro a waitlist (formulario simple, ver ADR-004)
- Explicación del producto (estático)

El mapa, reportes, rutas y BDA **no se construyen para web** en esta fase. Si el componente de mapa termina funcionando también en web "gratis" (MapLibre lo permite), no se invierte tiempo extra en pulirlo ahí.

**Consecuencias:** Evita duplicar esfuerzo de QA en una plataforma que no es el foco (nativo/APK).

---

## ADR-003: Mapas — react-native-maps + tiles OpenStreetMap + OSRM (REVISADO 2026-08-27)

**Estado:** Aceptado — **revisado el 2026-08-27**: se sustituye MapLibre por `react-native-maps`.

**Contexto (revisado):** La decisión original era `@maplibre/maplibre-react-native`, pero ese módulo es nativo y **no renderiza dentro de Expo Go** (requiere un dev build/APK de EAS con el código nativo embebido). Para mantener la velocidad de desarrollo probando directo en Expo Go y no depender de un build de EAS por cada ajuste de UI, Jhostin aprobó cambiar a **`react-native-maps` con `UrlTile` de OSM**.

**Decisión:**
- **`react-native-maps`** (compatible con Expo Go) con capa `UrlTile` de OpenStreetMap: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` con atribución.
- **Geometría de ruta:** servicio **OSRM** público (`https://router.project-osrm.org/route/v1/foot/{lon},{lat};{lon},{lat}?overview=full&geometries=geojson`) para traer la polyline entre coordenadas.
- **Coloreado por inseguridad:** heurística simple del PRD (rojo/ámbar/verde según densidad de reportes de `nearby_incident_reports`), sin pesos de seguridad reales en esta fase.

**Alternativa descartada (en esta revisión):**
- `@maplibre/maplibre-react-native` — no corre en Expo Go; se reserva para cuando la app pase a dev build/APK (ADRs suelen re-evaluarse entonces).
- Leaflet en web — la web es solo pre-experiencia de landing (ADR-002), no incluye mapa.

**Consecuencias:**
- (+) Se prueba directo en Expo Go sin build nativo.
- (+) `react-native-maps` es el estándar de facto en Expo; soporta `Polyline`, `Marker`, `UrlTile`.
- (−) `UrlTile` de `tile.openstreetmap.org` puede tener límites de uso y requiere atribución visible; revisar si el volumen exige un proveedor dedicado (MapTiler u otro) más adelante.
- Pendiente: confirmar que el coloreado multi-segmento de la polyline se vea bien con la heurística; los colores se aplican segmento a segmento sobre la geometría GeoJSON de OSRM.

---

## ADR-004: Backend — Supabase (Postgres + PostGIS + Auth)

**Estado:** Aceptado (ya estaba decidido; aquí se detalla la implementación)

**Decisión:**
- Supabase como único backend (Auth, DB, Storage).
- Extensión **PostGIS** activada desde el día 1 para queries geoespaciales (zonas, distancia, "reportes cerca de mí").
- Todas las tablas con **Row Level Security (RLS) activado desde la primera migración** — nunca se desactiva "temporalmente para probar". Esto es la barrera de seguridad real, no las API keys.

**Consecuencias:** El agente de código NUNCA debe generar una tabla sin política RLS explícita, aunque sea `USING (true)` temporal documentado en decisions.md.

---

## ADR-005: Modelo de autenticación — Anónimo + Waitlist desacoplada

**Estado:** Aceptado

**Contexto:** Jhostin quiere usuarios siempre anónimos entre sí y frente a sus reportes, pero necesita identificar a los primeros 500 registrados en waitlist para el beneficio gratuito.

**Decisión:**
- **Identidad técnica:** Supabase Auth anónimo (`signInAnonymously`) al primer uso. Este `user_id` es el que firma reportes, likes, comentarios. Nunca se expone como "perfil público" con nombre real.
- **Waitlist:** tabla separada `waitlist_entries` (email o teléfono, `created_at`, `benefit_granted boolean`). NO tiene foreign key obligatoria hacia el usuario anónimo en el momento del registro (puede registrarse en waitlist desde la landing/PWA sin siquiera abrir la app).
- **Vínculo al beneficio:** cuando el usuario anónimo abre la app por primera vez y confirma su email/teléfono de waitlist (paso opcional de "reclamar beneficio"), se crea la relación `waitlist_entries.claimed_by_user_id = auth.uid()`. A partir de ahí ese `user_id` queda marcado como beneficiario, pero sigue siendo anónimo para el resto del sistema.
- Los primeros 500 = los primeros 500 registros en `waitlist_entries` ordenados por `created_at`, marcados `benefit_granted = true` vía función/trigger.

**Confirmado:** Waitlist captura **solo email**, verificado con **OTP** (Supabase Auth soporta OTP por email nativamente vía `signInWithOtp`). Esto además simplifica el flujo: el mismo mecanismo de OTP puede usarse luego para "reclamar beneficio" y opcionalmente upgradear la sesión anónima a una identidad con email, sin pedir password.

**Consecuencias:** El anonimato del usuario frente a la comunidad queda intacto; el dato de contacto vive aislado y solo se usa para el beneficio, nunca para mostrar identidad dentro de BarrIA.

---

## ADR-006: Repositorio y estrategia de ramas

**Estado:** Aceptado (default propuesto, sin objeción)

**Decisión:**
- Repo separado: `barriaapp` (ya existe la carpeta local, se inicializa git ahora).
- Rama `main` siempre debe compilar y correr — es la única rama que se usa para generar el APK de entrega.
- Todo trabajo nuevo (feature, fix, experimento) va en una rama `feature/<nombre-corto>` o `fix/<nombre-corto>`.
- Merge a `main` solo cuando la feature funciona end-to-end en el emulador/dispositivo. Con equipo de una persona + agente, el "code review" es una pasada de Jhostin revisando el diff antes de mergear.
- Commits pequeños y descriptivos (`feat: agrega pantalla de reporte`, `fix: corrige RLS de incident_reports`).

**Por qué esto importa para "que no se arruine todo":** si el agente rompe algo en una rama de feature, `main` sigue intacto y siempre puedes volver atrás. Sin ramas, un error del agente en una tarea puede tumbar una feature que ya funcionaba.

---

## ADR-007: Manejo de estado en la app

**Estado:** Aceptado

**Decisión:** **Zustand** para estado global simple (usuario actual, ruta activa, filtros de mapa). React Query (`@tanstack/react-query`) para todo lo que viene de Supabase (fetch, cache, refetch de reportes/noticias).

**Por qué no Redux:** demasiada ceremonia para el tiempo disponible (~5-10 hrs/semana) y para que un agente de código mantenga consistencia sin fricción.

---

## ADR-008: Navegación

**Estado:** Aceptado

**Decisión:** **Expo Router** (basado en archivos, ya viene con Expo). Estructura de carpetas = estructura de pantallas, lo cual ayuda a que el agente ubique rápido dónde tocar cada feature sin tocar otras.

---

## ADR-009: Figma como mediador (no MCP directo en OpenCode)

**Estado:** Aceptado

**Contexto:** El MCP de Figma no está accesible desde OpenCode. Jhostin lo usa desde Claude.ai.

**Decisión:**
- Claude (aquí) extrae el diseño de cada pantalla vía Figma MCP y genera un archivo de spec en `/docs/figma-specs/<nombre-pantalla>.md` con: node-id, descripción de layout, colores/tipografía (tokens de marca ya definidos: `#D95C27`, Plus Jakarta Sans ExtraBold + Inter), textos exactos, y comportamiento esperado de cada elemento interactivo.
- OpenCode (el agente que programa) implementa **a partir de ese archivo .md**, no del Figma en vivo.
- Cuando el diseño cambie en Figma, se regenera el `.md` correspondiente y se referencia en el commit que actualiza esa pantalla.

**Consecuencias:** Esto desacopla "cuándo se puede tocar Figma" de "cuándo se puede programar" — evita que un cambio de diseño a medio implementar rompa el trabajo del agente.

---

## ADR-010: Variables de entorno y secretos

**Estado:** Aceptado

**Decisión:**
- `.env` en `.gitignore` desde el primer commit.
- Solo se exponen al cliente las variables con prefijo `EXPO_PUBLIC_` (ej. `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). La anon key de Supabase es pública por diseño — la seguridad real vive en RLS (ADR-004), no en ocultar esa key.
- Ninguna service role key de Supabase se usa jamás en el cliente (app). Si se necesita lógica privilegiada, va en una Edge Function de Supabase.

---

## ADR-011: Testing y "definition of done" para el MVP

**Estado:** Aceptado

**Contexto:** Tiempo limitado, no hay margen para suite de tests exhaustiva antes del 5 de septiembre.

**Decisión:** No se invierte en tests automatizados en esta fase. En su lugar, cada feature tiene una checklist manual de QA (definida en AGENT.md) que el agente debe correr y reportar antes de marcar una tarea como terminada. Se reevalúa agregar tests automatizados después del MVP si el proyecto avanza a producción real.

---

## ADR-012: Contactos de emergencia — se construye sin esperar diseño en Figma

**Estado:** Aceptado

**Contexto:** La pantalla de "Emergencia Envio" (`19:188`) muestra el resultado (comisaría/hospital cercano, notificación enviada), pero no existe en Figma una pantalla para que el usuario configure sus contactos de emergencia. Jhostin confirmó que esta feature debe construirse igual, sin bloquearse esperando el diseño.

**Decisión:**
- El agente de código diseña una **UI mínima funcional** para configurar contactos de emergencia (nombre + teléfono, lista de máximo 3-5 contactos), usando los tokens de marca ya definidos (`#D95C27`, Plus Jakarta Sans ExtraBold + Inter) y el mismo lenguaje visual de las pantallas ya implementadas (bordes redondeados, tarjetas), pero **sin spec de Figma como referencia** — se documenta como excepción en `/docs/figma-specs/emergencia-contactos.md` (creado por el agente, no extraído de Figma).
- Cuando exista el diseño real en Figma, esta pantalla se reemplaza y el `.md` se marca como "reemplazado por diseño oficial" en vez de borrarse (para trazabilidad).
- El envío real de notificación (SMS/WhatsApp/push a los contactos) se mantiene como **placeholder en MVP** (ver PRD.md sección 3.1, feature #10) — la configuración de contactos se construye ahora, el disparo real de la alerta puede quedar simulado (ej. log o alerta en pantalla) si el tiempo no alcanza para integrar un proveedor de SMS.

**Consecuencias:** Se prioriza no bloquear el desarrollo por falta de diseño, aceptando que esta pantalla específica tendrá una pasada de "pulido visual" después, cuando (si) llegue el diseño oficial.

---

## ADR-013: Columnas geography(Point) se escriben vía funciones RPC, no GeoJSON directo

**Estado:** Aceptado

**Contexto:** En la práctica, PostgREST/Supabase **no convierte GeoJSON a la columna `geography(Point)`** al hacer un `insert` directo desde el cliente (error `invalid geometry`). Esto afectó a `incident_reports` (Feature #9) y a `location_feed_posts` (Feature #12).

**Decisión:**
- Toda escritura en columnas `geography(Point)` va por una **función RPC** (`SECURITY INVOKER`) que construye el punto con `ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography` y, cuando el esquema lo exige, fija `user_id = auth.uid()` dentro de la función.
- Ejemplos: `insert_incident_report(long, lat, incident_type, ...)`, `create_location_feed_post(long, lat, content, category)`.
- La lectura geoespacial también va por RPC (ej. `nearby_incident_reports(...)`), y se evita devolver `user_id` crudo a la UI (ADR-005).

**Consecuencias:**
- (+) Abstrae PostGIS del cliente; el agente solo pasa `long`/`lat` y datos negocio.
- (+) El `user_id` se fija en el servidor con `auth.uid()`, reforzando RLS (la política `insert_own` sigue exigiendo `WITH CHECK (auth.uid() = user_id)`).
- (−) Se necesita una función nueva por cada operación de escritura geoespacial (ligero boilerplate, pero consistente).

---

## ADR-014: Categorías de la BDA (Feature #12)

**Estado:** Aceptado (provisional hasta el spec 101:867)

**Contexto:** No existe el spec de Figma `101:867` al momento de implementar la BDA. El PRD §3.1 lista categorías de ejemplo (`restaurantes | hospitales | comisaria | otros`) y remite a Figma para el resto.

**Decisión:** Usar las categorías `restaurantes | hospitales | comisarias | otro`, alineadas a los ejemplos del PRD, con sus íconos/marcas correspondientes y valor `category` en `location_feed_posts`. Cuando exista el spec `101:867` de Figma, las categorías reales reemplazan a esta lista y se marca este ADR como "reemplazado por diseño oficial".

---

## ADR-015: Inclusión del 4º tab "BDA" en la barra inferior

**Estado:** Aceptado (provisional hasta el spec 101:867 / revisión visual con diseño)

**Contexto:** El spec de Home (`19:64`) define una barra de **3 tabs** (Otros | Inicio | Noticias) con Inicio centrado. La Feature #12 necesita acceder al feed de la BDA, y su pantalla vive en `app/(tabs)/bda.tsx` (estructura de tabs según AGENT.md §3).

**Decisión:** Agregar la BDA como **4º tab** (Otros | Inicio | Noticias | BDA) con un ícono propio (bandera/flag), pese a que el spec de Home muestra 3. Se acepta que Inicio ya no queda perfectamente centrado. Cuando exista el spec `101:867` y se coordine con diseño, se hará el pulido visual final (posición, ícono, estilo) y se ajustará este ADR si cambia el arreglo de tabs.

---

## ADR-016: Tabla `emergency_contacts` (Feature #10)

**Estado:** Aceptado

**Contexto:** La Feature #10 requiere que el usuario configure hasta 5 contactos de emergencia (nombre + teléfono). El modelo de datos PRD v1 **no incluye** esa tabla; listaba solo zones, incident_reports, location_feed_posts/reactions, saved_routes, news_items y waitlist_entries. Se agrega como decisión propia.

**Decisión:**
- Crear `emergency_contacts (id, user_id, name, phone, sort_order, created_at)`.
- `user_id` con `DEFAULT auth.uid()` para que el servidor fije el dueño sin que la app lo gestione.
- **RLS owner-only**: cada usuario (anónimo/autenticado, ADR-005) solo puede leer/insertar/editar/borrar sus propios contactos (`auth.uid() = user_id`). Son PII del propio dueño y nunca se exponen a otros usuarios.
- El "centro más cercano" para la pantalla de envío usa lista estática local de referencias de Lima Norte + haversine (geolocalización), sin necesidad de tabla de lugares todavía.

**Consecuencias:**
- (+) Consistente con el backend/RLS y sobrevive reinstalaciones (a diferencia de guardar solo en AsyncStorage).
- (+) `user_id` se deriva en servidor, reforzando seguridad.
- (−) Es una tabla de PII sujeta a revisión cuando existan los términos/privacy del producto.

---

## Historial de cambios a este documento

| Fecha | Cambio |
|---|---|
| 2026-08-26 | Creación inicial del documento, ADR-001 a ADR-011 |
| 2026-08-26 | ADR-005 actualizado (waitlist: email + OTP, confirmado). Agregado ADR-012 (contactos de emergencia sin diseño) |
| 2026-08-27 | ADR-003 revisado (react-native-maps + OSM + OSRM). ADR-013 (escritura geography via RPC), ADR-014 (categorías BDA), ADR-015 (4º tab BDA) |
| 2026-08-27 | ADR-016 (tabla emergency_contacts) |
