# PILE OF SHAME V9.1 — Conectar Supabase

Tu proyecto ya viene configurado para:

- Project URL: `https://zxsbhgdjhcbubochycfo.supabase.co`
- Publishable key: incluida en `supabase-config.js`

La publishable key es una clave de cliente. **No añadas nunca una Secret key o service_role al proyecto web.**

## 1. Crear la base de datos

1. En Supabase abre tu proyecto.
2. Ve a **SQL Editor**.
3. Pulsa **New query**.
4. Abre el archivo `supabase_setup.sql` de este ZIP.
5. Copia todo el contenido.
6. Pégalo en el SQL Editor.
7. Pulsa **Run**.

Eso crea:

- perfiles,
- seguidores,
- amistad por seguimiento mutuo,
- publicaciones,
- privacidad público / amigos / privado,
- likes únicos,
- comentarios,
- colección,
- proyectos,
- wishlist,
- bucket para avatar y banner,
- políticas RLS.

## 2. Imprescindible para registro sin correo

PILE OF SHAME oculta completamente el email al usuario y usa internamente una identidad técnica derivada del `@usuario`.

En Supabase entra en:

**Authentication → Providers → Email**

y **desactiva `Confirm Email`**.

Sin eso, Supabase intentará verificar una dirección que el usuario nunca ha proporcionado y el registro no podrá iniciar sesión inmediatamente.

## 3. Probar

Sirve la carpeta por HTTP; no abras `index.html` con doble clic.

En Windows:

```bash
python -m http.server 8080
```

Abre:

```text
http://localhost:8080
```

Crea una primera cuenta:

- Nombre
- @usuario
- contraseña

No pide correo ni teléfono.

## 4. Probar la parte social

Para comprobar seguidores/amigos:

1. Crea una cuenta.
2. Cierra sesión.
3. Crea una segunda cuenta distinta.
4. En **Explorar**, sigue a la primera.
5. Vuelve a la primera y síguela también.
6. Ahora ambas aparecerán como **Amigos**.
7. Una publicación marcada `Amigos` solo será visible con seguimiento mutuo.

## 5. Backup

En **Ajustes → Cuenta y copia de seguridad** puedes exportar un JSON con:

- perfil,
- publicaciones propias,
- colección,
- proyectos,
- wishlist,
- usuarios seguidos.

La restauración está pensada para recuperar **tus datos** dentro de una cuenta nueva. En esta fase no recupera automáticamente la contraseña ni reclama el mismo `@usuario` de una cuenta perdida.

## Qué está conectado en V9

- Registro y login reales.
- Perfil real.
- Foto y banner reales en Supabase Storage.
- Seguidores reales.
- Amigos = seguimiento mutuo.
- Feed real.
- Privacidad aplicada también por RLS.
- Like real con máximo uno por usuario.
- Colección real.
- Materiales de hobby reales.
- Backup de datos.

## Lo que queda para la siguiente fase

- Fotos en publicaciones.
- Comentarios con interfaz completa.
- Notificaciones reales/push.
- Proyectos completos.
- Wishlist completa.
- Ver el perfil/colección de otra persona al pulsar su usuario.


## Si venías de V9 y te salía “No se puede comprobar el usuario”

Ejecuta de nuevo **todo** el archivo `supabase_setup.sql` de esta V9.1.

El script usa `create table if not exists`, `create or replace` y recrea las
políticas de forma segura, así que puedes ejecutarlo aunque ya hubieras probado
la V9.

La V9.1 además ya no consulta `profiles` antes del registro: deja que PostgreSQL
controle directamente si el `@usuario` es único.
