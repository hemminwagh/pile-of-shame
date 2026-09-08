# HobbyCircle — Fase 1

Primera base funcional de una PWA para coleccionismo, pintura y comunidad privada.

## Qué incluye ahora
- Feed de actividad.
- Colección personal.
- Añadir piezas.
- Publicar en el feed.
- Comunidad de 5 personas de demostración.
- Perfil y estadísticas básicas.
- Guardado local en el dispositivo mediante localStorage.
- Exportar/importar copia de seguridad JSON.
- PWA instalable.
- Service Worker para funcionamiento offline básico.
- Preparada para conectar Supabase en la siguiente fase.

## Probar en Windows
La PWA necesita servirse por HTTP/HTTPS para que funcione el Service Worker.

### Opción rápida con Python
1. Abre una terminal dentro de esta carpeta.
2. Ejecuta:
   `python -m http.server 8080`
3. Abre:
   `http://localhost:8080`

### Opción GitHub Pages
1. Crea un repositorio nuevo en GitHub.
2. Sube todo el contenido de esta carpeta a la raíz.
3. En Settings → Pages, elige Deploy from a branch.
4. Selecciona `main` y `/root`.
5. Guarda.
6. GitHub te dará la URL pública de la PWA.

## Instalar en iPhone
1. Abre la URL en Safari.
2. Compartir.
3. Añadir a pantalla de inicio.
4. Ábrela desde el icono.

## Instalar en Android
1. Abre la URL en Chrome.
2. Menú.
3. Instalar aplicación / Añadir a pantalla de inicio.

## Siguiente fase recomendada
- Supabase Auth.
- Usuarios reales.
- Datos separados por usuario.
- Feed compartido.
- Comentarios y reacciones reales.
- Fotos.
- Grupo privado.
- Privacidad por publicación.
- Notificaciones push.
