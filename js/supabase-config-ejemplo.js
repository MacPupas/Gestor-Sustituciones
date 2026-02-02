/**
 * Configuracion de Supabase para Control de Sustituciones
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo como supabase-config.js
 * 2. Reemplaza las credenciales con las de tu proyecto
 * 3. Incluyelo en tu index.html antes de store.js
 */

// ============================================
// CONFIGURACION - REEMPLAZAR CON TUS CREDENCIALES
// ============================================

// URL de tu proyecto Supabase (ej: https://abcdefgh12345678.supabase.co)
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';

// Clave anonima (publica) - Se encuentra en Settings > API > Project API keys
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...tu-clave-aqui';

// ============================================
// INICIALIZACION DEL CLIENTE
// ============================================

// Crear cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hacer disponible globalmente
window.supabaseClient = supabaseClient;

// Funcion helper para verificar conexion
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('teachers')
            .select('count', { count: 'exact' });
        
        if (error) throw error;
        
        console.log('Conexion a Supabase exitosa');
        console.log('Total profesores:', data);
        return true;
    } catch (error) {
        console.error('Error conectando a Supabase:', error.message);
        return false;
    }
}

// Verificar conexion al cargar
document.addEventListener('DOMContentLoaded', () => {
    checkSupabaseConnection();
});

// Exportar funciones
window.checkSupabaseConnection = checkSupabaseConnection;
