/**
 * Configuracion de Supabase para Control de Sustituciones
 * 
 * Soporta:
 * - Variables de entorno (para Vercel/Producción)
 * - Valores hardcodeados (para desarrollo local)
 * - localStorage como fallback
 */

// ============================================
// CONFIGURACION
// ============================================

// Intentar obtener credenciales de variables de entorno (Vercel)
// Si no existen, usar valores para desarrollo local
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 
                     'https://iiljblcelelupcmteqfx.supabase.co';

const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbGpibGNlbGVsdXBjbXRlcWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTQ0NzcsImV4cCI6MjA4NTUzMDQ3N30.UCJCENpA62PJzh6BTPWUZBpY0847c40tvUgJiIOMSnQ';

// ============================================
// INICIALIZACION DEL CLIENTE
// ============================================

// Variable global para el cliente de Supabase
let supabaseClient = null;

// Funcion para inicializar Supabase
function initSupabase() {
    // Verificar que las credenciales no esten vacias
    if (!SUPABASE_URL || SUPABASE_URL.trim() === '' ||
        !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim() === '') {
        console.warn('⚠️  Supabase no configurado. Usando localStorage como fallback.');
        console.info('Para configurar Supabase en Vercel:');
        console.info('1. Ve a tu proyecto en vercel.com');
        console.info('2. Settings > Environment Variables');
        console.info('3. Agrega SUPABASE_URL y SUPABASE_ANON_KEY');
        return false;
    }
    
    try {
        // Crear cliente de Supabase
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // IMPORTANTE: Actualizar la variable global para que store.js pueda usarla
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Cliente Supabase inicializado correctamente');
        console.log('🔗 URL:', SUPABASE_URL.substring(0, 30) + '...');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        return false;
    }
}

// Funcion helper para verificar conexion
async function checkSupabaseConnection() {
    const client = window.supabaseClient || supabaseClient;
    if (!client) {
        console.warn('Supabase no esta configurado');
        return false;
    }
    
    try {
        const { data, error, count } = await client
            .from('teachers')
            .select('*', { count: 'exact' })
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Conexion a Supabase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error.message);
        return false;
    }
}

// Funcion para verificar si Supabase esta disponible
function isSupabaseAvailable() {
    return (window.supabaseClient || supabaseClient) !== null;
}

// Inicializar Supabase inmediatamente
initSupabase();

// Hacer funciones disponibles globalmente
window.supabaseClient = supabaseClient;
window.initSupabase = initSupabase;
window.checkSupabaseConnection = checkSupabaseConnection;
window.isSupabaseAvailable = isSupabaseAvailable;
