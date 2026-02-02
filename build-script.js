/**
 * Script de Build para Vercel
 * 
 * Este script inyecta las variables de entorno en los archivos JS
 * durante el proceso de build en Vercel.
 * 
 * Uso en vercel.json:
 * {
 *   "buildCommand": "node build-script.js && cp -r . dist"
 * }
 */

const fs = require('fs');
const path = require('path');

try {
    console.log('📁 Directorio actual:', process.cwd());
    console.log('📂 Contenido:', fs.readdirSync('.'));
    
    // Verificar que exista el directorio js
    if (!fs.existsSync('js')) {
        console.log('📂 Creando directorio js...');
        fs.mkdirSync('js', { recursive: true });
    }
    
    // Leer variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    console.log('🔍 SUPABASE_URL existe:', !!supabaseUrl);
    console.log('🔍 SUPABASE_ANON_KEY existe:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️  Variables de entorno no configuradas. Usando valores de desarrollo.');
    }
    
    // Crear archivo de configuración de entorno
    const envConfigContent = `// Archivo generado automáticamente durante el build
// NO MODIFICAR MANUALMENTE
window.ENV = {
    SUPABASE_URL: '${supabaseUrl}',
    SUPABASE_ANON_KEY: '${supabaseKey}'
};
`;
    
    // Escribir archivo
    fs.writeFileSync('js/env-config.js', envConfigContent);
    console.log('✅ Variables de entorno inyectadas en js/env-config.js');
    
    // Verificar que index.html existe
    if (!fs.existsSync('index.html')) {
        throw new Error('index.html no encontrado');
    }
    
    // Modificar index.html para incluir el script
    let indexHtml = fs.readFileSync('index.html', 'utf8');
    
    // Verificar si ya tiene el script
    if (!indexHtml.includes('env-config.js')) {
        // Insertar antes de supabase-config.js
        indexHtml = indexHtml.replace(
            '<script src="js/supabase-config.js">',
            '<script src="js/env-config.js"></script>\n    <script src="js/supabase-config.js">'
        );
        
        fs.writeFileSync('index.html', indexHtml);
        console.log('✅ index.html actualizado con env-config.js');
    } else {
        console.log('ℹ️  index.html ya contiene env-config.js');
    }
    
    console.log('🎉 Build completado!');
} catch (error) {
    console.error('❌ Error en build:', error.message);
    console.error(error.stack);
    process.exit(1);
}
// Temporary edit to allow git commit
