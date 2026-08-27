# AGENT.md — Instrucciones para el agente de código (OpenCode) en BarrIA

> Este documento es la fuente de verdad de **cómo trabajar** en este repo. `PRD.md` dice **qué** construir. `decisions.md` dice **por qué** se eligió cada cosa técnica. Este archivo dice **cómo** tocar el código sin romper lo que ya funciona.
>
> **Regla de oro:** si algo en una tarea contradice `PRD.md` o `decisions.md`, o si falta información para decidir con seguridad, DETENTE y pregunta a Jhostin. No asumas ni improvises una decisión de arquitectura nueva.

## 1. Contexto del proyecto

BarrIA es una app nativa (Expo/React Native) de navegación y seguridad comunitaria para Lima Norte, Perú. Backend en Supabase. Ver `PRD.md` para features y `decisions.md` para el stack completo y sus razones.

## 2. Antes de escribir código

1. Lee `PRD.md` y localiza la feature exacta que se te pide (número de tabla en la sección 3.1).
2. Si la tarea toca una pantalla de Figma, busca el spec correspondiente en `/docs/figma-specs/<pantalla>.md`. Si no existe todavía, avisa — no inventes el diseño desde cero ni adivines colores/textos.
3. Revisa `decisions.md` por si ya existe un ADR relevante (ej. cómo manejar mapas, auth, estado).
4. Si la tarea requiere una decisión técnica nueva (librería, patrón, estructura) que no está cubierta, propone la decisión, espera confirmación, y **luego** agrégala a `decisions.md` como nuevo ADR antes de continuar.

## 3. Estructura de carpetas (convención)

```
barriaapp/
  app/                      # rutas de Expo Router, 1 carpeta/archivo = 1 pantalla
    (auth)/
      login.tsx
      signup.tsx
    (tabs)/
      home.tsx
      noticias.tsx
      bda.tsx
    ruta/
      buscar.tsx
      activa.tsx
      reporte.tsx
    emergencia.tsx
  components/               # componentes reutilizables, sin lógica de negocio pesada
  lib/
    supabase.ts             # cliente único de Supabase
    queries/                # funciones de fetch/mutate por dominio (reportes, rutas, noticias...)
  store/                    # stores de Zustand
  types/                    # tipos TS compartidos (idealmente generados desde el schema de Supabase)
  docs/
    figma-specs/            # specs por pantalla generados desde Figma (ver decisions.md ADR-009)
  PRD.md
  AGENT.md
  decisions.md
```

**Regla de aislamiento:** cada feature vive en su propia carpeta/archivo dentro de `app/` y usa sus propias queries en `lib/queries/`. Evita que una tarea sobre "Reporte" termine modificando código de "Ruta Activa" salvo que sea estrictamente necesario y se explique por qué en el commit.

## 4. Convenciones de código

- TypeScript estricto, sin `any` salvo justificación en comentario.
- Nombres de archivos y componentes en base a la pantalla de Figma cuando aplique (ej. `ReportePage.tsx` para node `18:49`), para que sea fácil rastrear diseño → código.
- Un componente = una responsabilidad. Si una pantalla tiene lógica compleja (ej. cálculo de ruta), esa lógica va en `lib/`, no inline en el componente.
- Comentarios en español donde documenten decisiones de negocio (ej. por qué un umbral es 500), en inglés/neutro donde sea puramente técnico. No es una regla estricta, prioriza consistencia con lo que ya exista en el repo.

## 5. Seguridad (no negociable)

- Nunca uses la `service_role key` de Supabase en código de cliente (app). Solo `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Toda tabla nueva en Supabase necesita política RLS explícita en la misma tarea que la crea. Si no sabes qué política aplica, pregunta — no la dejes abierta "para probar después".
- Nunca commitees `.env` ni credenciales. Verifica `.gitignore` antes de tu primer commit si el repo es nuevo.
- Los reportes e interacciones de usuario deben poder escribirse/leerse sin exponer qué usuario anónimo específico las hizo a otros usuarios (ver `decisions.md` ADR-005). Si una query devuelve el `user_id` crudo a la UI, revisa si eso viola el anonimato.

## 6. Git y ramas

- No trabajes directo sobre `main`. Crea `feature/<nombre>` o `fix/<nombre>` para cada tarea.
- Commits pequeños, un propósito por commit, mensaje en formato `tipo: descripción corta` (`feat:`, `fix:`, `chore:`, `docs:`).
- Al terminar una feature, deja el branch listo para que Jhostin revise el diff antes de mergear a `main`. No mergees automáticamente salvo que se te indique explícitamente.

## 7. Definition of Done (checklist antes de marcar una tarea como terminada)

- [ ] La pantalla/feature compila y corre en el emulador (o se indica cómo probarla).
- [ ] No se rompió ninguna pantalla/feature existente (prueba manual rápida de las pantallas más cercanas/relacionadas).
- [ ] RLS revisado si se tocó una tabla de Supabase.
- [ ] No hay secretos ni claves hardcodeadas en el diff.
- [ ] El código sigue la estructura de carpetas de la sección 3.
- [ ] Si se tomó una decisión técnica nueva, está reflejada en `decisions.md`.
- [ ] Si se implementó una pantalla de Figma, coincide con el spec de `/docs/figma-specs/` (colores, textos, orden de elementos) o se explica la diferencia.

## 8. Qué hacer si algo no está claro

No adivines. Opciones en orden de preferencia:
1. Si la duda es de diseño → revisa `/docs/figma-specs/`; si no existe el spec, pide que se genere antes de continuar.
2. Si la duda es de producto (qué debe hacer una feature) → cita la sección de `PRD.md` donde debería estar y señala el vacío.
3. Si la duda es técnica/arquitectura → propone 1-2 opciones con trade-offs breves y espera confirmación antes de codear, luego documenta en `decisions.md`.

## 9. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-08-26 | Creación inicial |
