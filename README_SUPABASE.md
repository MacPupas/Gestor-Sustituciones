# Instrucciones para Configurar Supabase

## Resumen de Cambios Realizados

Se ha implementado el soporte completo para Supabase. La aplicación ahora puede:
- ✅ Usar Supabase como base de datos principal (persistencia en la nube)
- ✅ Seguir funcionando con localStorage si Supabase no está configurado (compatibilidad hacia atrás)
- ✅ Migrar datos existentes desde localStorage a Supabase
- ✅ Sincronizar automáticamente todos los cambios con Supabase

## Archivos Creados/Modificados

### Archivos Nuevos:
1. **`js/supabase-config.js`** - Configuración de conexión a Supabase
2. **`js/migrar-a-supabase.js`** - Script para migrar datos existentes
3. **`supabase_schema.sql`** - Estructura completa de base de datos para Supabase

### Archivos Modificados:
1. **`index.html`** - Añadido el cliente de Supabase
2. **`js/store.js`** - Actualizado para soportar Supabase con fallback a localStorage
3. **`js/app.js`** - Actualizado para manejar operaciones asíncronas

## Pasos para Completar la Implementación

### Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta (gratuita)
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración (1-2 minutos)
4. Ve a **Settings > API** en el panel de Supabase
5. Copia:
   - **URL** (ej: `https://abcdefgh12345678.supabase.co`)
   - **anon public** key (empieza con `eyJhbGciOiJIUzI1NiIs...`)

### Paso 2: Crear la Base de Datos

1. En el panel de Supabase, ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega TODO el contenido del archivo `supabase_schema.sql`
4. Ejecuta la consulta (botón **Run**)
5. Verifica que no haya errores

### Paso 3: Configurar Credenciales

1. Abre el archivo `js/supabase-config.js`
2. Reemplaza estas líneas con tus credenciales:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';  // <-- TU URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';      // <-- TU CLAVE
```

### Paso 4: Migrar Datos Existentes

Si tienes datos guardados en localStorage que quieres conservar:

#### Opción A: Usar el script automático (Recomendado)

1. Abre la aplicación en el navegador
2. Abre la consola del desarrollador (F12 > Console)
3. Descomenta esta línea en `index.html`:
   ```html
   <script src="js/migrar-a-supabase.js"></script>
   ```
4. Recarga la página
5. En la consola, ejecuta:
   ```javascript
   migrarDatosASupabase()
   ```
6. Sigue las instrucciones en pantalla
7. Una vez completado, vuelve a comentar la línea del script

#### Opción B: Empezar desde cero

Si prefieres empezar con datos limpios, simplemente no migres nada. La app creará los datos de ejemplo automáticamente.

### Paso 5: Verificar Funcionamiento

1. Recarga la página
2. Abre la consola (F12)
3. Deberías ver mensajes como:
   ```
   ✅ Cliente Supabase inicializado correctamente
   🌐 Usando Supabase como backend
   ✅ Datos cargados desde Supabase
   ```

4. Crea una sustitución de prueba
5. Recarga la página - los datos deberían persistir

## Solución de Problemas

### Error: "Supabase no configurado"
- Verifica que hayas reemplazado las credenciales en `supabase-config.js`
- Asegúrate de que no haya espacios en blanco al copiar la URL y la clave

### Error: "Failed to fetch"
- Verifica tu conexión a internet
- Comprueba que el proyecto de Supabase esté activo (no en pausa)

### Los datos no aparecen después de migrar
1. Recarga la página (F5)
2. Verifica en el panel de Supabase que los datos estén en las tablas
3. Abre la consola y ejecuta `verificarMigracion()` para ver el estado

### La aplicación funciona lenta
- Es normal durante la primera carga desde Supabase
- Los datos se cachean localmente después de la primera carga
- Considera implementar carga progresiva para grandes volúmenes de datos

## Características Implementadas

### Seguridad (RLS - Row Level Security)
- ✅ Lectura pública: Cualquiera puede ver los datos
- ✅ Modificación restringida: Solo usuarios autenticados pueden modificar
- ✅ Las políticas están configuradas en el SQL

### Backup Automático
- ✅ Supabase realiza backups automáticos diarios
- ✅ Los datos nunca se pierden incluso si cierras el navegador
- ✅ Puedes descargar backups manualmente desde el panel de Supabase

### Compatibilidad
- ✅ Si no configuras Supabase, la app funciona exactamente igual con localStorage
- ✅ Puedes alternar entre modos cambiando las credenciales
- ✅ Los datos de localStorage se mantienen como backup local

## Próximos Pasos Opcionales

### Habilitar Autenticación
Si quieres restringir quién puede modificar los datos:

1. En Supabase, ve a **Authentication > Providers**
2. Habilita **Email** provider
3. Crea usuarios manualmente o habilita el registro
4. Actualiza las políticas RLS en el SQL

### Sincronización en Tiempo Real
Para ver cambios instantáneos entre múltiples usuarios:

1. Implementar suscripciones en `store.js` (función ya preparada)
2. Activar el canal de tiempo real en Supabase

### App Móvil / Multi-dispositivo
Con Supabase configurado:
- ✅ Accede a la app desde cualquier dispositivo
- ✅ Los datos se sincronizan automáticamente
- ✅ Trabaja offline y sincroniza al reconectar (requiere implementación adicional)

## Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para ver mensajes de error
2. Verifica que el schema SQL se ejecutó sin errores
3. Comprueba que las credenciales sean correctas
4. Consulta la documentación de Supabase: https://supabase.com/docs

## Notas Importantes

⚠️ **NO compartas tu archivo `supabase-config.js` con las credenciales reales**
⚠️ **La clave `anon` es pública y segura para usar en el frontend**
⚠️ **Nunca uses la `service_role` key en el frontend (es solo para backend)**

## Éxito! 🎉

Una vez configurado, tus datos:
- ✅ Se guardan automáticamente en la nube
- ✅ Están disponibles desde cualquier dispositivo
- ✅ Tienen backup automático diario
- ✅ Nunca se pierden al cerrar el navegador
- ✅ Se pueden exportar/importar fácilmente

Para cualquier duda o problema, revisa los mensajes en la consola del navegador.
