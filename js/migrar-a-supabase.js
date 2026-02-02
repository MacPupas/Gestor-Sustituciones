/**
 * Script de Migracion de Datos a Supabase
 * 
 * Este script migra todos los datos existentes en localStorage a Supabase.
 * Ejecutar en la consola del navegador con la app abierta.
 * 
 * IMPORTANTE: Asegurate de haber configurado supabase-config.js antes de ejecutar!
 */

async function migrarDatosASupabase() {
    console.log('🚀 ============================================');
    console.log('🚀 INICIANDO MIGRACION A SUPABASE');
    console.log('🚀 ============================================\n');

    // Verificar que Supabase esta configurado
    if (typeof supabaseClient === 'undefined' || supabaseClient === null) {
        console.error('❌ ERROR: Supabase no esta configurado');
        console.error('   Por favor configura supabase-config.js primero');
        alert('❌ Error: Supabase no configurado. Configura el archivo supabase-config.js');
        return false;
    }

    // Verificar conexion
    console.log('📡 Verificando conexion a Supabase...');
    try {
        const { error } = await supabaseClient.from('teachers').select('count', { count: 'exact' }).limit(1);
        if (error) throw error;
        console.log('✅ Conexion exitosa\n');
    } catch (error) {
        console.error('❌ Error de conexion:', error.message);
        alert('❌ Error de conexion a Supabase: ' + error.message);
        return false;
    }

    // Crear backup antes de migrar
    console.log('💾 Creando backup de datos locales...');
    const backup = {
        teachers: JSON.parse(localStorage.getItem('teachers') || '[]'),
        subjects: JSON.parse(localStorage.getItem('subjects') || '[]'),
        substitutions: JSON.parse(localStorage.getItem('substitutions') || '[]'),
        substitutionSchedule: JSON.parse(localStorage.getItem('substitutionSchedule') || '[]'),
        fechaBackup: new Date().toISOString()
    };
    
    // Descargar backup
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-migracion-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Backup descargado\n');

    // Estadisticas
    console.log('📊 DATOS A MIGRAR:');
    console.log(`   - Profesores: ${backup.teachers.length}`);
    console.log(`   - Materias: ${backup.subjects.length}`);
    console.log(`   - Sustituciones: ${backup.substitutions.length}`);
    console.log(`   - Disponibilidad: ${backup.substitutionSchedule.length}\n`);

    const totalItems = backup.teachers.length + backup.subjects.length + 
                       backup.substitutions.length + backup.substitutionSchedule.length;
    
    if (totalItems === 0) {
        console.log('⚠️  No hay datos para migrar');
        alert('⚠️ No hay datos en localStorage para migrar');
        return false;
    }

    // Confirmacion
    if (!confirm(`Se migrarán ${totalItems} registros a Supabase.\n\n¿Continuar?`)) {
        console.log('❌ Migracion cancelada por el usuario');
        return false;
    }

    let exitosos = 0;
    let fallidos = 0;

    // 1. MIGRAR PROFESORES
    console.log('\n📚 1. MIGRANDO PROFESORES...');
    for (const teacher of backup.teachers) {
        try {
            const { data, error } = await supabaseClient
                .from('teachers')
                .insert([{
                    name: teacher.name,
                    email: teacher.email || '',
                    phone: teacher.phone || '',
                    department: teacher.department || ''
                }])
                .select()
                .single();
            
            if (error) throw error;
            console.log(`   ✅ ${teacher.name}`);
            exitosos++;
        } catch (error) {
            console.error(`   ❌ Error con ${teacher.name}:`, error.message);
            fallidos++;
        }
    }

    // Obtener mapeo de nombres a IDs
    console.log('   Obteniendo IDs de profesores...');
    const { data: teachersDB, error: teachersError } = await supabaseClient
        .from('teachers')
        .select('id, name');
    
    if (teachersError) {
        console.error('❌ Error obteniendo profesores:', teachersError);
        return false;
    }

    const teacherNameToId = {};
    teachersDB.forEach(t => {
        teacherNameToId[t.name.toLowerCase()] = t.id;
    });

    // 2. MIGRAR MATERIAS
    console.log('\n📖 2. MIGRANDO MATERIAS...');
    for (const subject of backup.subjects) {
        try {
            const times = (subject.time || '').split(' - ');
            const teacherId = teacherNameToId[(subject.teacher || '').toLowerCase()];
            
            const { data, error } = await supabaseClient
                .from('subjects')
                .insert([{
                    teacher_id: teacherId || null,
                    teacher_name: subject.teacher || '',
                    day: subject.day || '',
                    time_start: times[0] || '00:00:00',
                    time_end: times[1] || '00:00:00',
                    subject_code: subject.subject || '',
                    course_group: subject.courseGroup || '',
                    classroom: subject.code || '',
                    department: subject.department || ''
                }])
                .select()
                .single();
            
            if (error) throw error;
            console.log(`   ✅ ${subject.subject || 'Materia'} - ${subject.teacher || 'Sin prof'}`);
            exitosos++;
        } catch (error) {
            console.error(`   ❌ Error con materia:`, error.message);
            fallidos++;
        }
    }

    // 3. MIGRAR DISPONIBILIDAD
    console.log('\n📅 3. MIGRANDO DISPONIBILIDAD DE SUSTITUTOS...');
    for (const av of backup.substitutionSchedule) {
        try {
            const teacherId = teacherNameToId[(av.teacher || '').toLowerCase()];
            
            const { data, error } = await supabaseClient
                .from('substitution_availability')
                .insert([{
                    teacher_id: teacherId || null,
                    teacher_name: av.teacher || '',
                    day: av.day || '',
                    time_start: av.startTime || '00:00:00',
                    time_end: av.endTime || '00:00:00',
                    options: av.options || ''
                }])
                .select()
                .single();
            
            if (error) throw error;
            console.log(`   ✅ ${av.teacher || 'Sin nombre'} - ${av.day || 'Sin dia'}`);
            exitosos++;
        } catch (error) {
            console.error(`   ❌ Error con disponibilidad:`, error.message);
            fallidos++;
        }
    }

    // 4. MIGRAR SUSTITUCIONES
    console.log('\n🔄 4. MIGRANDO SUSTITUCIONES...');
    for (const sub of backup.substitutions) {
        try {
            const teacherId = teacherNameToId[(sub.teacherName || '').toLowerCase()];
            
            // Insertar sustitucion principal
            const { data: subData, error: subError } = await supabaseClient
                .from('substitutions')
                .insert([{
                    teacher_id: teacherId || null,
                    teacher_name: sub.teacherName || '',
                    date: sub.date || new Date().toISOString().split('T')[0],
                    reason: sub.reason || '',
                    status: sub.status || 'active'
                }])
                .select()
                .single();
            
            if (subError) throw subError;
            
            // Insertar schedules si existen
            if (sub.schedule && sub.schedule.length > 0) {
                const schedulesToInsert = sub.schedule.map(sch => {
                    const times = (sch.time || '').split(' - ');
                    const subId = teacherNameToId[(sch.substitute || '').toLowerCase()];
                    const excSubId = teacherNameToId[(sch.exceptionalSubstitute || '').toLowerCase()];
                    
                    return {
                        substitution_id: subData.id,
                        time_start: times[0] || '00:00:00',
                        time_end: times[1] || '00:00:00',
                        subject_code: sch.subject || '',
                        course_group: sch.courseGroup || '',
                        substitute_teacher_id: subId || null,
                        substitute_name: sch.substitute || '',
                        exceptional_substitute_id: excSubId || null,
                        exceptional_substitute_name: sch.exceptionalSubstitute || '',
                        is_covered: !!sch.substitute
                    };
                });
                
                const { error: schError } = await supabaseClient
                    .from('substitution_schedules')
                    .insert(schedulesToInsert);
                
                if (schError) throw schError;
            }
            
            console.log(`   ✅ Sustitucion: ${sub.teacherName || 'Sin nombre'} - ${sub.date || 'Sin fecha'}`);
            exitosos++;
        } catch (error) {
            console.error(`   ❌ Error con sustitucion:`, error.message);
            fallidos++;
        }
    }

    // RESUMEN
    console.log('\n🎉 ============================================');
    console.log('🎉 MIGRACION COMPLETADA');
    console.log('🎉 ============================================');
    console.log(`📊 Resultados:`);
    console.log(`   ✅ Exitosos: ${exitosos}`);
    console.log(`   ❌ Fallidos: ${fallidos}`);
    console.log(`   📈 Total: ${exitosos + fallidos}`);
    console.log('\n💡 Proximos pasos:');
    console.log('   1. Recarga la pagina para cargar los datos desde Supabase');
    console.log('   2. Verifica que todos los datos se hayan migrado correctamente');
    console.log('   3. Si hay errores, revisa la consola para mas detalles');
    console.log('============================================\n');

    alert(`Migracion completada!\n\nExitosos: ${exitosos}\nFallidos: ${fallidos}\n\nRecarga la pagina para usar Supabase.`);

    return { exitosos, fallidos };
}

// Funcion para verificar datos migrados
async function verificarMigracion() {
    console.log('🔍 Verificando datos migrados...\n');
    
    try {
        const { data: teachers, error: tError } = await supabaseClient
            .from('teachers')
            .select('*');
        
        const { data: subjects, error: sError } = await supabaseClient
            .from('subjects')
            .select('*');
        
        const { data: substitutions, error: subError } = await supabaseClient
            .from('substitutions')
            .select('*');
        
        const { data: availability, error: aError } = await supabaseClient
            .from('substitution_availability')
            .select('*');

        console.log('📊 DATOS EN SUPABASE:');
        console.log(`   👨‍🏫 Profesores: ${teachers?.length || 0}`);
        console.log(`   📚 Materias: ${subjects?.length || 0}`);
        console.log(`   🔄 Sustituciones: ${substitutions?.length || 0}`);
        console.log(`   📅 Disponibilidad: ${availability?.length || 0}`);
        
        if (teachers?.length > 0) {
            console.log('\n👨‍🏫 Primeros 3 profesores:');
            teachers.slice(0, 3).forEach(t => console.log(`   - ${t.name}`));
        }

    } catch (error) {
        console.error('❌ Error verificando migracion:', error);
    }
}

// Hacer funciones disponibles globalmente
window.migrarDatosASupabase = migrarDatosASupabase;
window.verificarMigracion = verificarMigracion;

console.log('📝 Script de migracion cargado');
console.log('   Ejecuta: migrarDatosASupabase() para iniciar la migracion');
console.log('   Ejecuta: verificarMigracion() para verificar los datos migrados');
