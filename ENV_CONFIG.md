# Variables de Entorno para Vercel

Copia este archivo como `.env.local` para desarrollo local.

## Desarrollo Local

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
SUPABASE_URL=https://iiljblcelelupcmteqfx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbGpibGNlbGVsdXBjbXRlcWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTQ0NzcsImV4cCI6MjA4NTUzMDQ3N30.UCJCENpA62PJzh6BTPWUZBpY0847c40tvUgJiIOMSnQ
```

## Configuración en Vercel

### Método 1: Dashboard Web (Recomendado)

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto
3. Ve a **Settings > Environment Variables**
4. Haz clic en **Add New**
5. Agrega las variables:
   - Name: `SUPABASE_URL`
   - Value: `https://iiljblcelelupcmteqfx.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
6. Repite para `SUPABASE_ANON_KEY`

### Método 2: CLI de Vercel

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Agregar variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### Método 3: Importar desde archivo .env

1. Ve a **Settings > Environment Variables**
2. Haz clic en **Import .env.local file**
3. Sube tu archivo `.env.local`

## Notas Importantes

⚠️ **Seguridad:**
- La `SUPABASE_ANON_KEY` es **pública** y segura para usar en el frontend
- NUNCA uses la `SUPABASE_SERVICE_ROLE_KEY` en el frontend
- NUNCA commitees el archivo `.env.local` a GitHub

⚠️ **GitHub:**
- `.env.local` está en `.gitignore` por defecto
- Las variables configuradas en Vercel no se exponen en el repositorio

## Verificación

Después de configurar las variables, redeploya tu proyecto:

```bash
# Si usas GitHub integration, automáticamente se redeploya
# Si usas CLI:
vercel --prod
```

Verifica en la consola del navegador que dice:
```
✅ Cliente Supabase inicializado correctamente
```

## Solución de Problemas

### "Supabase no configurado" en producción

1. Verifica que las variables estén configuradas en Vercel
2. Revisa que los nombres sean exactamente: `SUPABASE_URL` y `SUPABASE_ANON_KEY`
3. Redeploya el proyecto
4. Limpia la caché del navegador (Ctrl+Shift+R)

### Variables no aparecen en el frontend

Para aplicaciones vanilla JS en Vercel, las variables de entorno necesitan ser inyectadas. 

Opción A: Usar el plugin de reemplazo de Vercel
Opción B: Crear un archivo `env.js` durante el build que exponga las variables

Contacta soporte si necesitas ayuda con la inyección de variables.
