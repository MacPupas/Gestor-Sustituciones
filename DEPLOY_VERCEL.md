# Despliegue en Vercel

Esta guía explica cómo desplegar la aplicación en Vercel conectada con GitHub y Supabase.

## 📋 Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [GitHub](https://github.com) con el repositorio del proyecto
- Cuenta en [Supabase](https://supabase.com) con el proyecto configurado
- Proyecto conectado GitHub ↔ Vercel

## 🚀 Pasos para el Despliegue

### 1. Configurar Variables de Entorno en Vercel

Ve al dashboard de Vercel y configura las variables:

```
Dashboard del Proyecto → Settings → Environment Variables
```

Agrega estas dos variables:

| Nombre | Valor | Environments |
|--------|-------|--------------|
| `SUPABASE_URL` | `https://iiljblcelelupcmteqfx.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (tu clave completa) | ✅ Production, ✅ Preview, ✅ Development |

**⚠️ Importante:** Usa la `anon key`, NUNCA la `service_role key`.

### 2. Configurar el Build Command

En el dashboard de Vercel:

```
Settings → Build & Deployment → Build Command
```

Cambia el comando de build a:

```bash
node build-script.js
```

O si prefieres usar el framework preset:
- Framework Preset: `Other`
- Build Command: `node build-script.js`
- Output Directory: `.`

### 3. Archivos Importantes

El proyecto incluye estos archivos para el despliegue:

- **`vercel.json`**: Configuración del proyecto en Vercel
- **`build-script.js`**: Script que inyecta variables de entorno
- **`js/env-config.js`**: Archivo generado con las credenciales (no subir a GitHub)
- **`js/supabase-config.js`**: Lee las credenciales de `window.ENV`

### 4. Estructura del Proceso de Build

```
1. Vercel detecta push a GitHub
2. Ejecuta: node build-script.js
3. build-script.js lee variables de entorno
4. Genera js/env-config.js con las credenciales
5. Despliega los archivos
6. La app lee credenciales de window.ENV
```

## 🔒 Seguridad

### ✅ Lo que es seguro:
- La `SUPABASE_ANON_KEY` en el frontend (está diseñada para eso)
- Las políticas RLS en Supabase protegen tus datos
- Las variables en Vercel están encriptadas

### ❌ Lo que NO hacer:
- NUNCA uses la `SUPABASE_SERVICE_ROLE_KEY` en el frontend
- NUNCA commitees `js/env-config.js` con valores reales
- NUNCA expongas credenciales en el código fuente

## 🧪 Verificar el Despliegue

Después de desplegar, verifica en la consola del navegador:

```
✅ Cliente Supabase inicializado correctamente
🔗 URL: https://iiljblcelelupcmteqfx...
📦 Inicializando store...
🌐 Usando Supabase como backend
✅ Datos cargados desde Supabase
```

Si ves esto, ¡todo está funcionando! 🎉

## 🐛 Solución de Problemas

### "Supabase no configurado" en producción

1. Verifica que las variables estén en Vercel
2. Revisa que el build command sea `node build-script.js`
3. Ve a "Deployments" y haz clic en "Redeploy"
4. Limpia caché del navegador (Ctrl+Shift+R)

### "Failed to fetch" o errores de conexión

1. Verifica que la URL de Supabase sea correcta
2. Comprueba que el proyecto de Supabase esté activo
3. Verifica en Supabase: Settings > API > Project URL

### Las variables no se inyectan

1. Ve a la pestaña "Build Logs" en Vercel
2. Busca: "✅ Variables de entorno inyectadas"
3. Si no aparece, revisa que el archivo `build-script.js` exista

### Error 401 Unauthorized

Las políticas RLS están activadas. Tienes dos opciones:

**Opción 1**: Desactivar RLS en Supabase (para desarrollo):
```sql
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
-- ... para todas las tablas
```

**Opción 2**: Configurar políticas para usuarios anónimos (más seguro):
```sql
-- Permitir a usuarios anónimos insertar
CREATE POLICY "Allow anonymous insert" ON public.teachers
FOR INSERT WITH CHECK (true);
```

## 📁 Archivos que NO deben subirse a GitHub

Asegúrate de que estos archivos estén en `.gitignore`:

```
.env
.env.local
js/env-config.js  # Se genera durante el build
```

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollo local**: Usa `js/env-config.js` con valores de desarrollo
2. **Commit**: Sube cambios a GitHub (sin credenciales)
3. **Deploy**: Vercel ejecuta build-script.js e inyecta credenciales
4. **Producción**: La app usa las credenciales de producción

## 📞 Soporte

Si tienes problemas:
1. Revisa los "Build Logs" en Vercel
2. Verifica la consola del navegador (F12)
3. Comprueba que Supabase esté configurado correctamente
4. Consulta la documentación de [Vercel](https://vercel.com/docs) o [Supabase](https://supabase.com/docs)

---

**¡Listo!** Tu aplicación ahora está configurada para funcionar con Vercel + Supabase. 🚀
