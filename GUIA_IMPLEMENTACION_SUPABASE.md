# Guía de Implementación en Supabase

## Control de Sustituciones - Migración a Supabase

Esta guía te ayudará a configurar Supabase para que los datos de la aplicación no se borren y puedan sincronizarse entre dispositivos.

---

## 📋 Requisitos Previos

- Cuenta en [Supabase](https://supabase.com) (gratuita)
- Proyecto de Supabase creado
- Acceso a la consola SQL de Supabase

---

## 🚀 Paso 1: Configurar Proyecto en Supabase

### 1.1 Crear Proyecto
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Haz clic en "New Project"
3. Selecciona tu organización
4. Configura:
   - **Name**: `control-sustituciones` (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Elige la más cercana a tu ubicación (ej: `West US (North California)`)
5. Espera a que se cree el proyecto (1-2 minutos)

### 1.2 Obtener Credenciales
Una vez creado el proyecto, ve a **Settings > API** y anota:
- **URL**: `https://<tu-proyecto>.supabase.co`
- **anon public**: `eyJhbGciOiJIUzI1NiIs...` (clave pública)
- **service_role secret**: `eyJhbGciOiJIUzI1NiIs...` (clave privada - ¡mantener secreta!)

---

## 🗄️ Paso 2: Crear Estructura de Base de Datos

### 2.1 Ejecutar Script SQL
1. En el panel de Supabase, ve a **SQL Editor**
2. Haz clic en **New query**
3. Copia y pega todo el contenido del archivo `supabase_schema.sql`
4. Haz clic en **Run** (esquina superior derecha)
5. Verifica que no haya errores en la consola

### 2.2 Verificar Tablas Creadas
Ve a **Table Editor** y confirma que existen estas tablas:
- ✅ `teachers` (Profesores)
- ✅ `subjects` (Materias/Asignaturas)
- ✅ `substitutions` (Ausencias)
- ✅ `substitution_schedules` (Detalle de sustituciones)
- ✅ `substitution_availability` (Disponibilidad de sustitutos)
- ✅ `app_settings` (Configuración)
- ✅ `activity_log` (Registro de actividad)

---

## 🔐 Paso 3: Configurar Autenticación (Opcional pero Recomendado)

### 3.1 Habilitar Autenticación Anónima
Si quieres que cualquiera pueda usar la app sin login:
1. Ve a **Authentication > Settings**
2. En **Site URL**, pon la URL donde hospedarás la app (o `http://localhost:8080` para desarrollo)
3. Desactiva **Enable email confirmations** (opcional, para facilitar el uso)

### 3.2 Configurar Políticas de Acceso
Las políticas RLS ya están configuradas en el script SQL:
- ✅ Lectura pública (cualquiera puede ver datos)
- ✅ Modificación solo para usuarios autenticados

---

## 📦 Paso 4: Instalar Cliente de Supabase

### 4.1 Agregar CDN al HTML
En tu archivo `index.html`, agrega en el `<head>`:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 4.2 Crear Archivo de Configuración
Crea un archivo nuevo `js/supabase-config.js`:

```javascript
// Configuración de Supabase
const SUPABASE_URL = 'https://<tu-proyecto>.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...tu-clave-anon...';

// Inicializar cliente
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para usar en otros archivos
window.supabaseClient = supabaseClient;
```

⚠️ **IMPORTANTE**: Reemplaza `<tu-proyecto>` y `tu-clave-anon` con tus credenciales reales.

---

## 🔄 Paso 5: Migrar Datos Existentes

### 5.1 Script de Migración desde localStorage
Crea un archivo `js/migrate-to-supabase.js`:

```javascript
/**
 * Script para migrar datos de localStorage a Supabase
 * Ejecutar una sola vez en el navegador con datos existentes
 */

async function migrateDataToSupabase() {
    console.log('🚀 Iniciando migración de datos...');
    
    try {
        // 1. Migrar Profesores
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        if (teachers.length > 0) {
            console.log(`📚 Migrando ${teachers.length} profesores...`);
            const { data, error } = await supabaseClient
                .from('teachers')
                .insert(teachers.map(t => ({
                    name: t.name,
                    email: t.email,
                    phone: t.phone,
                    department: t.department
                })));
            
            if (error) throw error;
            console.log('✅ Profesores migrados');
            
            // Guardar mapeo de IDs antiguos a nuevos UUIDs
            const teacherMap = {};
            const { data: newTeachers } = await supabaseClient
                .from('teachers')
                .select('id, name');
            
            newTeachers.forEach(nt => {
                const old = teachers.find(ot => ot.name === nt.name);
                if (old) teacherMap[old.id] = nt.id;
            });
            
            // 2. Migrar Materias
            const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            if (subjects.length > 0) {
                console.log(`📖 Migrando ${subjects.length} materias...`);
                
                // Primero necesitamos mapear los nombres a IDs
                const { data: allTeachers } = await supabaseClient
                    .from('teachers')
                    .select('id, name');
                
                const teacherNameToId = {};
                allTeachers.forEach(t => teacherNameToId[t.name] = t.id);
                
                const subjectsToInsert = subjects.map(s => {
                    const times = s.time ? s.time.split(' - ') : ['', ''];
                    return {
                        teacher_id: teacherNameToId[s.teacher] || null,
                        teacher_name: s.teacher,
                        day: s.day,
                        time_start: times[0] || '00:00:00',
                        time_end: times[1] || '00:00:00',
                        subject_code: s.subject,
                        subject_name: s.subject,
                        course_group: s.courseGroup,
                        classroom: s.code,
                        department: s.department
                    };
                });
                
                const { error: subjectsError } = await supabaseClient
                    .from('subjects')
                    .insert(subjectsToInsert);
                
                if (subjectsError) throw subjectsError;
                console.log('✅ Materias migradas');
            }
            
            // 3. Migrar Sustituciones
            const substitutions = JSON.parse(localStorage.getItem('substitutions') || '[]');
            if (substitutions.length > 0) {
                console.log(`🔄 Migrando ${substitutions.length} sustituciones...`);
                
                for (const sub of substitutions) {
                    // Crear sustitución principal
                    const { data: newSub, error: subError } = await supabaseClient
                        .from('substitutions')
                        .insert({
                            teacher_id: teacherMap[sub.teacherId] || null,
                            teacher_name: sub.teacherName,
                            date: sub.date,
                            reason: sub.reason,
                            status: sub.status,
                            notes: sub.notes || ''
                        })
                        .select()
                        .single();
                    
                    if (subError) throw subError;
                    
                    // Migrar schedule detallado
                    if (sub.schedule && sub.schedule.length > 0) {
                        const schedulesToInsert = sub.schedule.map(sch => {
                            const times = sch.time ? sch.time.split(' - ') : ['', ''];
                            return {
                                substitution_id: newSub.id,
                                time_start: times[0] || '00:00:00',
                                time_end: times[1] || '00:00:00',
                                subject_code: sch.subject,
                                course_group: sch.courseGroup,
                                substitute_teacher_id: teacherNameToId[sch.substitute] || null,
                                substitute_name: sch.substitute,
                                exceptional_substitute_id: teacherNameToId[sch.exceptionalSubstitute] || null,
                                exceptional_substitute_name: sch.exceptionalSubstitute,
                                is_covered: !!sch.substitute
                            };
                        });
                        
                        const { error: schError } = await supabaseClient
                            .from('substitution_schedules')
                            .insert(schedulesToInsert);
                        
                        if (schError) throw schError;
                    }
                }
                console.log('✅ Sustituciones migradas');
            }
            
            // 4. Migrar Disponibilidad de Sustitutos
            const availability = JSON.parse(localStorage.getItem('substitutionSchedule') || '[]');
            if (availability.length > 0) {
                console.log(`📅 Migrando ${availability.length} registros de disponibilidad...`);
                
                const availabilityToInsert = availability.map(av => ({
                    teacher_id: teacherNameToId[av.teacher] || null,
                    teacher_name: av.teacher,
                    day: av.day,
                    time_start: av.startTime || '00:00:00',
                    time_end: av.endTime || '00:00:00',
                    options: av.options || ''
                }));
                
                const { error: avError } = await supabaseClient
                    .from('substitution_availability')
                    .insert(availabilityToInsert);
                
                if (avError) throw avError;
                console.log('✅ Disponibilidad migrada');
            }
        }
        
        console.log('🎉 ¡Migración completada exitosamente!');
        alert('Migración completada. Los datos ahora están en Supabase.');
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
        alert('Error en migración: ' + error.message);
    }
}

// Función para exportar datos a JSON (backup)
function exportDataToJSON() {
    const data = {
        teachers: JSON.parse(localStorage.getItem('teachers') || '[]'),
        subjects: JSON.parse(localStorage.getItem('subjects') || '[]'),
        substitutions: JSON.parse(localStorage.getItem('substitutions') || '[]'),
        substitutionSchedule: JSON.parse(localStorage.getItem('substitutionSchedule') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-control-sustituciones-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 Backup exportado');
}

// Hacer funciones disponibles globalmente
window.migrateDataToSupabase = migrateDataToSupabase;
window.exportDataToJSON = exportDataToJSON;
```

### 5.2 Ejecutar Migración
1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12 > Console)
3. Asegúrate de que `supabase-config.js` esté cargado
4. Ejecuta:
   ```javascript
   exportDataToJSON();  // Primero haz un backup
   migrateDataToSupabase();  // Luego migra los datos
   ```

---

## 🔧 Paso 6: Actualizar Store.js para Usar Supabase

### 6.1 Modificar store.js
Actualiza el archivo `js/store.js` para usar Supabase en lugar de localStorage:

```javascript
/**
 * Data Store - Versión Supabase
 * Reemplaza localStorage por Supabase para persistencia en la nube
 */

const store = {
    // Estado local (cache)
    state: {
        teachers: [],
        subjects: [],
        substitutions: [],
        substitutionAvailability: [],
        isLoading: false,
        lastSync: null
    },
    
    // Inicializar datos desde Supabase
    async init() {
        console.log('📦 Inicializando store desde Supabase...');
        this.state.isLoading = true;
        
        try {
            await Promise.all([
                this.loadTeachers(),
                this.loadSubjects(),
                this.loadSubstitutions(),
                this.loadAvailability()
            ]);
            
            this.state.lastSync = new Date();
            console.log('✅ Store inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando store:', error);
            // Fallback a localStorage si hay error
            this.loadFromLocalStorage();
        } finally {
            this.state.isLoading = false;
        }
    },
    
    // Cargar profesores
    async loadTeachers() {
        const { data, error } = await supabaseClient
            .from('teachers')
            .select('*')
            .order('name');
        
        if (error) throw error;
        this.state.teachers = data || [];
    },
    
    // Cargar materias
    async loadSubjects() {
        const { data, error } = await supabaseClient
            .from('subjects')
            .select('*')
            .order('day')
            .order('time_start');
        
        if (error) throw error;
        this.state.subjects = data || [];
    },
    
    // Cargar sustituciones
    async loadSubstitutions() {
        const { data, error } = await supabaseClient
            .from('substitutions')
            .select(`
                *,
                substitution_schedules (*)
            `)
            .order('date', { ascending: false });
        
        if (error) throw error;
        this.state.substitutions = data || [];
    },
    
    // Cargar disponibilidad
    async loadAvailability() {
        const { data, error } = await supabaseClient
            .from('substitution_availability')
            .select('*')
            .order('day')
            .order('time_start');
        
        if (error) throw error;
        this.state.substitutionAvailability = data || [];
    },
    
    // CRUD Profesores
    async addTeacher(teacherData) {
        const { data, error } = await supabaseClient
            .from('teachers')
            .insert([teacherData])
            .select()
            .single();
        
        if (error) throw error;
        this.state.teachers.push(data);
        return data;
    },
    
    async updateTeacher(id, updates) {
        const { data, error } = await supabaseClient
            .from('teachers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        const index = this.state.teachers.findIndex(t => t.id === id);
        if (index !== -1) this.state.teachers[index] = data;
        return data;
    },
    
    async deleteTeacher(id) {
        const { error } = await supabaseClient
            .from('teachers')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        this.state.teachers = this.state.teachers.filter(t => t.id !== id);
    },
    
    // CRUD Sustituciones
    async addSubstitution(subData) {
        // Insertar sustitución principal
        const { data: substitution, error } = await supabaseClient
            .from('substitutions')
            .insert([{
                teacher_id: subData.teacherId,
                teacher_name: subData.teacherName,
                date: subData.date,
                reason: subData.reason,
                status: subData.status || 'active',
                notes: subData.notes || ''
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Insertar schedules si existen
        if (subData.schedule && subData.schedule.length > 0) {
            const schedules = subData.schedule.map(sch => ({
                substitution_id: substitution.id,
                time_start: sch.time ? sch.time.split(' - ')[0] : '00:00:00',
                time_end: sch.time ? sch.time.split(' - ')[1] : '00:00:00',
                subject_code: sch.subject,
                course_group: sch.courseGroup,
                substitute_teacher_id: sch.substituteId || null,
                substitute_name: sch.substitute,
                exceptional_substitute_id: sch.exceptionalSubstituteId || null,
                exceptional_substitute_name: sch.exceptionalSubstitute,
                is_covered: !!sch.substitute
            }));
            
            const { error: schError } = await supabaseClient
                .from('substitution_schedules')
                .insert(schedules);
            
            if (schError) throw schError;
        }
        
        await this.loadSubstitutions(); // Recargar para obtener relaciones
        return substitution;
    },
    
    async updateSubstitution(id, updates) {
        const { data, error } = await supabaseClient
            .from('substitutions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        await this.loadSubstitutions();
        return data;
    },
    
    async deleteSubstitution(id) {
        // Los schedules se borran automáticamente por CASCADE
        const { error } = await supabaseClient
            .from('substitutions')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        await this.loadSubstitutions();
    },
    
    // Métodos de compatibilidad hacia atrás (fallback a localStorage)
    loadFromLocalStorage() {
        this.state.teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        this.state.subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        this.state.substitutions = JSON.parse(localStorage.getItem('substitutions') || '[]');
        this.state.substitutionAvailability = JSON.parse(localStorage.getItem('substitutionSchedule') || '[]');
    },
    
    saveToLocalStorage() {
        // Solo como backup local
        localStorage.setItem('teachers', JSON.stringify(this.state.teachers));
        localStorage.setItem('subjects', JSON.stringify(this.state.subjects));
        localStorage.setItem('substitutions', JSON.stringify(this.state.substitutions));
        localStorage.setItem('substitutionSchedule', JSON.stringify(this.state.substitutionAvailability));
    },
    
    // Suscribirse a cambios en tiempo real (opcional)
    subscribeToChanges() {
        // Suscribirse a cambios en sustituciones
        supabaseClient
            .channel('substitutions-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'substitutions' },
                (payload) => {
                    console.log('Cambio en sustituciones:', payload);
                    this.loadSubstitutions();
                }
            )
            .subscribe();
    }
};

// Exportar
window.store = store;
```

---

## 🧪 Paso 7: Probar la Integración

### 7.1 Verificar Conexión
1. Abre la aplicación
2. Abre la consola del navegador
3. Ejecuta:
   ```javascript
   // Verificar que supabaseClient está disponible
   console.log(supabaseClient);
   
   // Probar conexión
   supabaseClient.from('teachers').select('*').then(console.log);
   ```

### 7.2 Test de Inserción
```javascript
// Crear un profesor de prueba
store.addTeacher({
    name: 'Profesor Test',
    email: 'test@escuela.com',
    phone: '123456789',
    department: 'Matemáticas'
}).then(result => console.log('Creado:', result));
```

### 7.3 Verificar en Supabase
Ve a **Table Editor > teachers** en Supabase y confirma que aparece el profesor de prueba.

---

## 📱 Paso 8: Configurar Sincronización en Tiempo Real (Opcional)

Si deseas que los cambios aparezcan automáticamente en todas las ventanas abiertas:

```javascript
// En tu archivo principal (app.js)
store.subscribeToChanges();
```

---

## 🔒 Paso 9: Seguridad Adicional

### 9.1 Configurar CORS
En Supabase, ve a **Authentication > URL Configuration**:
- **Site URL**: URL de tu app
- **Redirect URLs**: URLs adicionales permitidas

### 9.2 Habilitar Autenticación (si es necesario)
Si quieres restringir quién puede modificar datos:

1. Ve a **Authentication > Providers**
2. Habilita **Email** provider
3. Crea usuarios manualmente o permite registro

---

## 📚 Paso 10: Mantenimiento

### 10.1 Backups Automáticos
Supabase realiza backups automáticos cada día. Para descargar manualmente:
1. Ve a **Database > Backups**
2. Haz clic en **Download** en el backup deseado

### 10.2 Monitoreo
Ve a **Database > Usage** para ver:
- Espacio utilizado
- Consultas por segundo
- Conexiones activas

---

## ❓ Solución de Problemas

### Error: "Failed to fetch"
- Verifica que SUPABASE_URL sea correcta
- Comprueba tu conexión a internet
- Verifica que el proyecto no esté en pausa

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén configuradas correctamente
- Comprueba que estés usando la clave anon correcta

### Los datos no aparecen
- Recarga la página (F5)
- Verifica en el SQL Editor: `SELECT * FROM teachers;`
- Comprueba la consola del navegador por errores

### Error de CORS
- Verifica que la URL de tu app esté en **Site URL** de Supabase
- Para desarrollo local, usa `http://localhost:8080` o el puerto que uses

---

## ✅ Checklist Final

- [ ] Proyecto creado en Supabase
- [ ] Script SQL ejecutado sin errores
- [ ] Tablas creadas correctamente
- [ ] Credenciales configuradas en `supabase-config.js`
- [ ] Datos migrados desde localStorage
- [ ] Store.js actualizado para usar Supabase
- [ ] Pruebas de CRUD exitosas
- [ ] Backup creado antes de la migración
- [ ] App funcionando correctamente

---

## 📞 Soporte

- Documentación Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Comunidad Discord: [https://discord.gg/supabase](https://discord.gg/supabase)
- GitHub Issues: [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues)

---

**¡Listo!** Tu aplicación ahora usa Supabase y los datos persistirán incluso si se cierra el navegador o se cambia de dispositivo. 🎉
