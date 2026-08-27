# Spec Figma: Formulario de Reporte de Incidente (Nodo 18:49)

## 1. Estructura del Modal / Pantalla
* **Header:**
  * Botón de Cerrar/Atrás `X` a la izquierda.
  * Título central: "Crear Reporte de Incidente" (18px Bold, `#FFFFFF`).
* **Sección de Geolocalización (Mapa Mini):**
  * Vista previa del mapa fija (Altura: 140px, border-radius 12px).
  * Pin centrado `#D95C27` señalando el punto del reporte.
  * Texto inferior: "Punto fijado en tus coordenadas actuales" (12px, `#AAAAAA`).

## 2. Seleccionador de Tipo de Incidente
* **Grid de Tipos (2 columnas):**
  * Opciones: `Bache / Vía dañada`, `Robo / Inseguridad`, `Alumbrado defectuoso`, `Acumulación de basura`, `Otro`.
  * Tarjeta Seleccionable: Fondo `#2A2A2A`, borde `#3A3A3A` 1px. Al seleccionar: Borde `#D95C27` 2px y fondo `#D95C27` con opacidad 0.15.

## 3. Campos de Texto y Envío
* **Campo Descripción:**
  * Label: "Descripción corta del problema" (13px, `#FFFFFF`).
  * Input: Multilínea (height 90px), fondo `#1A1A1A`, texto `#FFFFFF`, placeholder `#666666`.
* **Botón Principal:**
  * Texto: "Publicar Reporte Anónimo".
  * Estilo: Ancho completo, altura 48px, fondo `#D95C27`, border-radius 8px.