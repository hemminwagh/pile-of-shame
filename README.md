# PILE OF SHAME — V9.3 Auth UI Fix

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


## Corrección V5 — logos embebidos

Los tres logos están ahora incrustados directamente en `index.html` como imágenes
PNG codificadas en data URI. El navegador ya no depende de encontrar
`assets/logo-40k.png`, `logo-sigmar.png` o `logo-fantasy.png`, por lo que el logo
no se rompe al mover archivos, probar localmente o desplegar en GitHub Pages.


## Cambio V6 — encabezados del usuario

Se han sustituido los logos del encabezado por las tres imágenes proporcionadas
por el usuario, embebidas directamente dentro del HTML para evitar errores de
ruta. Se usan tanto en la cabecera principal como en la pantalla “ELIGE TU SINO”.

Correspondencia:
- 40K → logo metálico azul
- Sigmar → logo dorado
- Fantasy → logo pergamino rojo


## Cambios V7

- Logos del encabezado algo más grandes.
- Inicio abre directamente en Actividad; eliminado el bloque explicativo superior.
- Colección abre directamente en el contenido; eliminado el bloque explicativo superior.
- Comunidad abre directamente en los miembros; eliminado el bloque explicativo superior.
- Perfil se mantiene como estaba.
- Añadir se reorganiza en tres desplegables:
  1. Miniatura.
  2. Material de hobby (pintura, pincel, herramienta u otro).
  3. Nueva publicación.
- Los materiales añadidos aparecen también en la colección con su tipo indicado.


## Cambios V8 — estructura social

- Eliminado el concepto de círculos.
- Nueva pestaña **Explorar**.
- Usuarios con:
  - seguidores,
  - seguidos,
  - amistad cuando el seguimiento es mutuo.
- Botones de seguir/dejar de seguir.
- Indicador **Amigos** cuando dos usuarios se siguen mutuamente.
- Publicaciones con visibilidad:
  - Todo el mundo,
  - Amigos,
  - Solo yo.
- El feed respeta la visibilidad del prototipo.
- Likes corregidos:
  - un usuario solo puede dar un like,
  - volver a pulsar quita el like.
- Perfil actualizado con seguidores y seguidos.
- La campana superior sigue siendo el acceso a notificaciones.
- Se mantiene Colección como pestaña principal.

> Nota: esta V8 sigue siendo un prototipo local. La unicidad real del like,
> permisos de privacidad, seguidores y cuentas se reforzarán también en la
> base de datos cuando conectemos Supabase.


## V9 — Backend real

Esta versión deja de usar usuarios simulados y conecta la app con Supabase.

Lee primero `SETUP_SUPABASE.md` y ejecuta `supabase_setup.sql` antes de probar el registro.


## V9.1
- Eliminada la comprobación anónima previa del @usuario.
- Añadidos permisos SQL explícitos para `anon` y `authenticated`.
- Mensajes de error de registro más claros.


## V9.2
- Corregido el dominio técnico usado por Supabase Auth.
- Ya no se usa el TLD reservado `.invalid`.
- No hace falta volver a ejecutar el SQL si V9.1 ya estaba instalado.


## V9.3
- Corregido el solapamiento entre Entrar y Crear cuenta.
- Solo un formulario puede mostrarse a la vez.
- Los campos del formulario inactivo quedan deshabilitados.
- Se fuerza el estado inicial a Entrar.
- No es necesario volver a ejecutar el SQL.
