# Spec Figma: BDA - Feed Comunitario (Nodo 101:867)

## 1. Diseño y Estructura Visual
* **Header de Pantalla:**
  * Título principal: "Publicaciones Comunitarias" (Tipografía Semibold, 20px, color `#FFFFFF`).
  * Subtítulo: "Espacio de interacción vecinal en Lima Norte" (Regular, 13px, color `#AAAAAA`).
* **Filtros por Categoría (Chips Horizontales Scrollable):**
  * Altura de chip: 36px, borde redondeado: 18px.
  * Opciones de filtro: `Todas` | `Restaurantes` | `Hospitales` | `Comisarias` | `Otro`.
  * Estado Activo: Fondo `#D95C27`, texto `#FFFFFF`.
  * Estado Inactivo: Fondo `#2A2A2A`, texto `#AAAAAA`, borde `#3A3A3A` 1px.

## 2. Tarjeta de Publicación (`BDACard`)
* **Contenedor:** Fondo `#1E1E1E`, border-radius 12px, padding interno 16px, margen inferior 12px.
* **Header de Tarjeta:**
  * Avatar de usuario o Tag de Categoría a la izquierda (Icono según categoría con fondo tintado).
  * Tipo de Categoría (Badge): Texto en MAYÚSCULAS, 11px Bold, color `#D95C27`.
  * Tiempo relativo a la derecha (ej. "Hace 15 min") en color `#777777`, 12px.
* **Cuerpo de Tarjeta:**
  * Título o Texto del Post: 15px Regular, color `#EEEEEE`, line-height 20px.
* **Footer de Tarjeta:**
  * Botón/Indicador "Ver ubicación en mapa" si tiene coordenadas adjuntas (Icono `pin` `#D95C27`).

## 3. Botón Flotante para Crear Post (FAB)
* **Posición:** Esquina inferior derecha (Absolute: `bottom: 24`, `right: 20`).
* **Estilo:** Círculo 56x56px, fondo `#D95C27`, sombra `#000000` con opacidad 0.3. Icono `plus` centrado en blanco `#FFFFFF`.