# PILE OF SHAME — Identidad visual V4

Prototipo visual funcional de la PWA.

## Incluye

- Pantalla inicial **ELIGE TU SINO**.
- Tres temas intercambiables:
  - **40K** — industrial / azul oscuro / cian.
  - **SIGMAR** — negro azulado / oro.
  - **FANTASY** — pergamino oscuro / borgoña / oro viejo.
- Tres logos-imagen reales PILE OF SHAME integrados como assets visuales completos: 40K, Sigmar y Fantasy.
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

## Logos

La cabecera ya no genera PILE OF SHAME mediante una fuente CSS. Cada tema carga
su propio archivo gráfico desde `/assets` y el selector ELIGE TU SINO utiliza
los mismos logos.

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


## Ajuste V4
Los logos del header y del selector de tema se han reemplazado por recortes más
grandes y completos, con su placa/ornamento/pergamino, para que se vean como
imagen visual real y no como simple lettering estilizado.
