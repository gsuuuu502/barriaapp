# Spec de Emergencia — Contactos de emergencia (creado por agente)

> **Node ID:** `19:188` (pantalla de envío) — sin spec de Figma para la UI de configuración de contactos (ver decisions.md ADR-012).
> **Estado:** Provisional, creado por el agente. Será reemplazado por el diseño oficial cuando exista.
> **Feature relacionada:** PRD.md #10.

## Qué se implementó

La pantalla `app/emergencia.tsx` integra, sobre la base de marca existente:

1. **Centro más cercano** (comisaría/hospital): usa geolocalización (expo-location) + lista estática local de referencia de Lima Norte (`lib/data/emergency-places.ts`) y calcula el más cercano por fórmula de haversine. Muestra nombre, tipo, distancia y botón **Llamar** (abre el marcador `tel:`).
2. **Botón ENVIAR ALERTA**: en el MVP es **simulado** (muestra confirmación "alerta enviada (simulada)") porque el disparo real SMS/WhatsApp/push está fuera de alcance (PRD §3.1 #10, §3.2).
3. **Modal "Configurar contactos"**: lista de contactos de emergencia (máximo 5), agregar por nombre + teléfono, eliminar. Se persiste en Supabase (tabla `emergency_contacts`, RLS owner-only; ver decisions.md ADR-016).

## Comportamiento

- La lista de contactos es del propio usuario anónimo; nunca se comparte con otros usuarios (RLS).
- Se muestran contadores `(n/5)`. Al llegar a 5 se deshabilita "Agregar contacto".

## Nota de trazabilidad

Cuando exista el diseño oficial de esta pantalla en Figma, esta UI se reemplaza y este archivo se marca como "reemplazado por diseño oficial" (no se borra).
