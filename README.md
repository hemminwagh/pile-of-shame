# PILE OF SHAME — Identidad visual V2

Prototipo visual funcional de la PWA.

## Incluye

- Pantalla inicial **ELIGE TU SINO**.
- Tres temas intercambiables:
  - **40K** — industrial / azul oscuro / cian.
  - **SIGMAR** — negro azulado / oro.
  - **FANTASY** — pergamino oscuro / borgoña / oro viejo.
- Logo tipográfico PILE OF SHAME adaptado a cada tema.
- Feed rediseñado.
- Barra inferior rediseñada.
- Botón central de añadir diferenciado por tema.
- Perfil con:
  - foto,
  - banner,
  - nombre,
  - usuario,
  - biografía,
  - una facción favorita general,
  - badge de facción,
  - pestañas Publicaciones / Colección / Proyectos / Wishlist.
- Editor de perfil funcional.
- Selector de tema rápido y desde Ajustes.
- Colección y creación de publicaciones del prototipo anterior.
- Datos guardados localmente en el dispositivo.
- PWA instalable y shell offline.

## Nota sobre logos

Los logos actuales están construidos tipográficamente y con CSS para poder probar
ya proporciones, presencia y comportamiento en los tres temas. Cuando demos por
buena la dirección, se sustituyen por los tres assets de logo finales sin tocar
la estructura de la app.

## Probar en Windows

Desde esta carpeta:

```bash
python -m http.server 8080
```

Después abre:

```text
http://localhost:8080
```

## GitHub Pages

Sube el contenido de esta carpeta a la raíz de un repositorio y activa:

Settings → Pages → Deploy from a branch → main → /root

## Próximo paso recomendado

Cerrar esta dirección visual contigo y después conectar Supabase:

1. Auth real.
2. Perfiles reales.
3. Grupo privado.
4. Colecciones por usuario.
5. Feed compartido.
6. Comentarios y reacciones.
7. Fotos.
8. Notificaciones.
