# Figma Spec — Home Page

**Node ID:** `19:64` | **File key:** `qaxULecHTCAezD4KW1R7Eq`
**Feature relacionada:** PRD.md #6 (Home) y #13 (rutas preestablecidas)

## Layout general

Pantalla de 393×852 (referencia iPhone). De arriba a abajo:

1. **Header curvo** (`#ED6838`, esquinas inferiores redondeadas 28px, alto 114px) conteniendo:
   - Status bar (safe area, hora del sistema — usar `SafeAreaView` + status bar nativo, no replicar el mock de Figma)
   - Search bar: input redondeado, fondo crema/beige claro, placeholder **"¿A dónde vamos?"**, ícono de lupa a la derecha. Al tocar, navega a la pantalla de Búsqueda de ruta (`19:124`), no busca inline.
2. **Mapa** (ocupa el resto del scroll visible, de y≈120 a y≈750): componente MapLibre con marcador de ubicación actual del usuario. En este spec estático el mapa es un placeholder de imagen; en código real es el mapa vivo (ver decisions.md ADR-003).
3. **Botón "ENVIAR ALERTA"** flotante sobre el mapa, cerca del fondo: fondo naranja translúcido `rgba(201,60,9,0.76)`, texto blanco, `Plus Jakarta Sans ExtraBold`, 20px, esquinas muy redondeadas (22px), ancho 344px. Al presionar → navega a `Emergencia Envio Page` (`19:188`).
4. **Accesos rápidos ("rutas preestablecidas")**: dos tarjetas lado a lado.
   - Tarjeta izquierda (145px): fondo `#FFFDCD`, texto superior gris "Ir a" (Inter Regular 15px), texto inferior negro/oscuro **"Casa"** (Inter ExtraBold 20px), flecha decorativa.
   - Tarjeta derecha (188px): fondo `#FFFCDC`, mismo patrón con **"Universidad"**.
   - Ambas leen de la tabla `saved_routes` del usuario (ver PRD.md sección 4). Si el usuario no tiene rutas guardadas, mostrar estado vacío con CTA "Agregar destino frecuente" (no está en el diseño original, pero es necesario — documentar como ajuste).
   - Al tocar una tarjeta → dispara cálculo de ruta hacia ese destino y navega a `Ruta Activa Page` (`18:38`).
5. **Navegación inferior** (tab bar): fondo `#E44F19`, esquinas superiores redondeadas 30px.
   - `otros` (izquierda): ícono genérico, texto blanco 40% opacidad.
   - `inicio` (centro, activo): pill de fondo `#FF7746`, texto blanco 100%.
   - `noticias` (derecha): ícono de noticias, texto blanco 40% opacidad.
   - Home indicator (barra blanca inferior, decorativo, safe area).

## Colores usados en esta pantalla

| Elemento | Color |
|---|---|
| Header / fondo curvo | `#ED6838` |
| Botón alerta | `rgba(201,60,9,0.76)` |
| Tarjeta "Casa" | `#FFFDCD` |
| Tarjeta "Universidad" | `#FFFCDC` |
| Tab bar fondo | `#E44F19` |
| Tab activo (pill) | `#FF7746` |

Nota: estos son los colores exactos extraídos de Figma para esta pantalla. El color de marca oficial de BarrIA es `#D95C27` — usar ese como base y estos tonos derivados (`#ED6838`, `#E44F19`, `#FF7746`) como variaciones de la misma paleta cálida, no como colores nuevos sin relación.

## Tipografía

- Títulos/botones destacados: **Plus Jakarta Sans ExtraBold**
- Texto de cuerpo/labels: **Inter** (Regular para labels secundarios, ExtraBold para valores destacados como "Casa"/"Universidad")

## Comportamiento esperado (no solo visual)

- Search bar es un **disparador de navegación**, no un input funcional en esta pantalla.
- El botón ENVIAR ALERTA debe tener un estado de "enviando" (loading breve) antes de navegar, para que el usuario sienta que algo está pasando (ver preview interactivo generado en el chat para referencia de la sensación esperada).
- Las tarjetas de accesos rápidos deben ser editables/configurables desde algún lado (no en el alcance de esta pantalla, pero dejar el componente preparado para recibir `label` y `destination` dinámicos, no hardcodeados).

## Assets

Los assets de imagen de esta pantalla en Figma (mapa de fondo, flechas decorativas) son temporales/de referencia — no se exportan como imágenes finales. El mapa se reemplaza por el componente de mapa real; las flechas decorativas pueden omitirse o reemplazarse por un ícono de Tabler/vector simple si se desea mantener el detalle visual.
