# Spec Figma: Noticias y Avisos Municipales (Nodo 97:344)

## 1. Diseño y Estructura Visual
* **Header de Pantalla:**
  * Título: "Noticias y Novedades" (Bold, 22px, `#FFFFFF`).
  * Badge de Ubicación actual: "Distrito: Comas / Carabayllo" (Fondo `#252525`, texto `#D95C27`, 12px).

## 2. Banner Destacado (Primera Noticia)
* **Contenedor:** Altura 180px, border-radius 16px, imagen de fondo con degradado oscuro inferior (`rgba(0,0,0,0.8)`).
* **Tag:** "URGENTE" o "MUNICIPAL" (Fondo `#D95C27`, texto blanco, 10px Bold).
* **Título Destacado:** 18px Bold, color `#FFFFFF`, máximo 2 líneas.
* **Fecha/Fuente:** "El Comercio / Municipalidad - Hoy" (12px, `#CCCCCC`).

## 3. Lista de Noticias Secundarias
* **Tarjeta de Noticia:**
  * Layout: Fila horizontal (FlexDirection: 'row'), alineación centro.
  * Thumbnail (Izquierda): 80x80px, border-radius 8px, `object-fit: cover`.
  * Contenido (Derecha): 
    * Categoría: 11px Bold en color `#D95C27`.
    * Título: 14px Semibold, color `#FFFFFF`, máximo 2 líneas.
    * Descripción corta: 12px Regular, color `#999999`, 1 línea.