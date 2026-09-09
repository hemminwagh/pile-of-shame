# PILE OF SHAME V9.5 — Auth sin correo ni teléfono

Esta versión deja de inventar emails internos.

Usa **Anonymous Sign-Ins** de Supabase, que crea un usuario autenticado con UUID y sesión
sin pedir email, teléfono ni proveedor externo.

## PASO 1 — Ejecutar el parche SQL

En Supabase:

1. SQL Editor.
2. New query.
3. Abre `supabase_v9_5_auth_patch.sql`.
4. Copia todo.
5. Run.

No necesitas borrar las tablas existentes.

## PASO 2 — Activar usuarios anónimos

En la configuración de **Authentication** de Supabase activa:

**Allow anonymous sign-ins**

No necesitas tocar Confirm Email para esta versión.

## Cómo funciona ahora

### Crear perfil
El usuario introduce únicamente:

- Nombre
- @usuario

Supabase crea una sesión anónima autenticada.

La app genera automáticamente un secreto aleatorio de recuperación de 256 bits y descarga:

`PILE_OF_SHAME_RECOVERY_tuusuario.json`

Guárdalo.

### Uso normal
Mientras el navegador conserve la sesión, al abrir la app se entra automáticamente.

### Recuperar cuenta
Si cambias de dispositivo, borras los datos del navegador o pierdes la sesión:

1. Abres PILE OF SHAME.
2. Pulsa **Recuperar**.
3. Selecciona el archivo de recuperación.
4. La app crea una sesión nueva y transfiere a ella el perfil y los datos de la cuenta antigua.

### Backup completo
Ajustes sigue permitiendo exportar un backup completo. Desde V9.5 también incluye
la información de recuperación necesaria.

## Importante
No pulses "Salir de este dispositivo" sin tener guardada una copia de recuperación.
