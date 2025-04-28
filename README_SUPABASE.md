# Solución al problema de Row Level Security (RLS) en Supabase

## Problema

El error `new row violates row-level security policy for table 'properties'` ocurre porque Supabase tiene habilitada la seguridad a nivel de fila (RLS) en la tabla 'properties', pero no hay una política que permita a los usuarios anónimos o incluso autenticados insertar datos.

## Solución

Hemos implementado las siguientes soluciones:

1. **Autenticación con Supabase**: Se ha creado un servicio de autenticación para Supabase que permite iniciar sesión y registrar usuarios.

2. **Página de inicio de sesión**: Se ha creado una página de inicio de sesión específica para Supabase en `/supabase-login`.

3. **Modificación de los servicios de API**: Se han modificado los servicios de API para verificar la autenticación antes de realizar operaciones en la tabla 'properties'.

## Pasos para solucionar el problema

### 1. Iniciar sesión en Supabase

Antes de intentar crear, actualizar o eliminar propiedades, debes iniciar sesión en Supabase:

1. Navega a la página de inicio de sesión de Supabase: `/supabase-login`
2. Inicia sesión con las siguientes credenciales:
   - Email: `admin@elsahm.com`
   - Contraseña: `Admin123!`

Si no tienes una cuenta, puedes registrarte en la misma página.

### 2. Configurar políticas de seguridad en Supabase

Si sigues teniendo problemas, debes configurar las políticas de seguridad en Supabase:

1. Inicia sesión en el panel de control de Supabase: https://app.supabase.io
2. Selecciona tu proyecto
3. Ve a "Authentication" > "Policies"
4. Para la tabla 'properties', crea las siguientes políticas:

#### Política para SELECT (lectura)
- Nombre: `Enable read access for all users`
- Operación: `SELECT`
- Definición: `true`

#### Política para INSERT (creación)
- Nombre: `Enable insert for authenticated users only`
- Operación: `INSERT`
- Definición: `auth.role() = 'authenticated'`

#### Política para UPDATE (actualización)
- Nombre: `Enable update for authenticated users only`
- Operación: `UPDATE`
- Definición: `auth.role() = 'authenticated'`

#### Política para DELETE (eliminación)
- Nombre: `Enable delete for authenticated users only`
- Operación: `DELETE`
- Definición: `auth.role() = 'authenticated'`

### 3. Script de inicialización

También hemos creado un script para inicializar la base de datos con un usuario administrador y configurar las políticas de seguridad. Para ejecutarlo:

```bash
cd dashboard
node src/scripts/initSupabase.js
```

## Notas adicionales

- La autenticación con Supabase es independiente de la autenticación con Firebase que se usa en el resto de la aplicación.
- Asegúrate de que la tabla 'properties' tenga una columna 'user_id' para almacenar el ID del usuario que crea la propiedad.
- Si necesitas desactivar temporalmente la seguridad a nivel de fila, puedes hacerlo desde el panel de control de Supabase en "Database" > "Tables" > "properties" > "RLS".
