/**
 * Data Store - Version con Soporte para Supabase
 * 
 * Este store usa Supabase como base de datos principal, con localStorage como fallback.
 * Si Supabase no esta configurado, la app funciona normalmente con localStorage.
 */

const store = {
    state: {
        teachers: [],
        substitutions: [],
        subjects: [],
        substitutionSchedule: [],
        isLoading: false,
        useSupabase: false,
        dataLoaded: false
    },

    async init() {
        console.log('📦 Inicializando store...');
        
        // Verificar si Supabase esta disponible (usar window.window.supabaseClient para obtener el valor actualizado)
        const client = window.window.supabaseClient || (typeof window.supabaseClient !== 'undefined' ? window.supabaseClient : null);
        
        if (client !== null) {
            this.state.useSupabase = true;
            console.log('🌐 Usando Supabase como backend');
            
            try {
                await this.loadAllFromSupabase();
                this.state.dataLoaded = true;
                console.log('✅ Datos cargados desde Supabase');
            } catch (error) {
                console.error('❌ Error cargando desde Supabase:', error);
                console.log('⚠️  Fallback a localStorage');
                this.state.useSupabase = false;
                this.loadAllFromLocalStorage();
            }
        } else {
            console.log('💾 Usando localStorage (Supabase no configurado)');
            this.loadAllFromLocalStorage();
        }
    },

    // ============================================
    // CARGA DE DATOS
    // ============================================

    async loadAllFromSupabase() {
        this.state.isLoading = true;
        
        try {
            await Promise.all([
                this.loadTeachersFromSupabase(),
                this.loadSubjectsFromSupabase(),
                this.loadSubstitutionsFromSupabase(),
                this.loadScheduleFromSupabase()
            ]);
        } finally {
            this.state.isLoading = false;
        }
    },

    loadAllFromLocalStorage() {
        const savedTeachers = localStorage.getItem('teachers');
        if (savedTeachers) {
            this.state.teachers = JSON.parse(savedTeachers);
        } else {
            this.state.teachers = [
                { id: '1', name: 'Maria Garcia', department: 'Matematicas' },
                { id: '2', name: 'Juan Lopez', department: 'Lengua' },
                { id: '3', name: 'Ana Martinez', department: 'Ingles' },
                { id: '4', name: 'Carlos Ruiz', department: 'Historia' }
            ];
            this.saveTeachers();
        }

        const savedSubjects = localStorage.getItem('subjects');
        this.state.subjects = savedSubjects ? JSON.parse(savedSubjects) : [];

        const savedSchedule = localStorage.getItem('substitutionSchedule');
        this.state.substitutionSchedule = savedSchedule ? JSON.parse(savedSchedule) : [];

        const savedSubs = localStorage.getItem('substitutions');
        if (savedSubs) {
            this.state.substitutions = JSON.parse(savedSubs);
        } else {
            this.state.substitutions = [
                {
                    id: 1,
                    teacherId: 1,
                    teacherName: 'Maria Garcia',
                    date: new Date().toISOString().split('T')[0],
                    reason: 'Enfermedad',
                    status: 'active',
                    substitute: null
                }
            ];
            this.save();
        }
    },

    async loadTeachersFromSupabase() {
        try {
            const { data, error } = await window.window.supabaseClient
                .from('teachers')
                .select('*')
                .order('name');
            
            if (error) throw error;
            this.state.teachers = data || [];
        } catch (error) {
            console.error('Error cargando profesores:', error);
            throw error;
        }
    },

    async loadSubjectsFromSupabase() {
        try {
            const { data, error } = await window.supabaseClient
                .from('subjects')
                .select('*')
                .order('day')
                .order('time_start');
            
            if (error) throw error;
            
            // Transformar datos de Supabase al formato de la app
            this.state.subjects = (data || []).map(s => ({
                id: s.id,
                teacher: s.teacher_name,
                day: s.day,
                time: `${s.time_start} - ${s.time_end}`,
                subject: s.subject_code,
                courseGroup: s.course_group,
                code: s.classroom,
                department: s.department
            }));
        } catch (error) {
            console.error('Error cargando materias:', error);
            throw error;
        }
    },

    async loadSubstitutionsFromSupabase() {
        try {
            const { data, error } = await window.supabaseClient
                .from('substitutions')
                .select(`
                    *,
                    substitution_schedules (*)
                `)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            // Transformar datos de Supabase al formato de la app
            this.state.substitutions = (data || []).map(sub => {
                const schedules = sub.substitution_schedules || [];
                return {
                    id: sub.id,
                    teacherId: sub.teacher_id,
                    teacherName: sub.teacher_name,
                    date: sub.date,
                    reason: sub.reason,
                    status: sub.status,
                    substitute: schedules[0]?.substitute_name || null,
                    schedule: schedules.map(s => ({
                        time: `${s.time_start} - ${s.time_end}`,
                        substitute: s.substitute_name,
                        exceptionalSubstitute: s.exceptional_substitute_name,
                        courseGroup: s.course_group,
                        subject: s.subject_code
                    }))
                };
            });
        } catch (error) {
            console.error('Error cargando sustituciones:', error);
            throw error;
        }
    },

    async loadScheduleFromSupabase() {
        try {
            const { data, error } = await window.supabaseClient
                .from('substitution_availability')
                .select('*')
                .order('day')
                .order('time_start');
            
            if (error) throw error;
            
            // Transformar datos de Supabase al formato de la app
            this.state.substitutionSchedule = (data || []).map(av => ({
                id: av.id,
                teacher: av.teacher_name,
                day: av.day,
                startTime: av.time_start,
                endTime: av.time_end,
                options: av.options || ''
            }));
        } catch (error) {
            console.error('Error cargando disponibilidad:', error);
            throw error;
        }
    },

    // ============================================
    // OPERACIONES CRUD - PROFESORES
    // ============================================

    async addTeacher(teacher) {
        // Verificar si ya existe
        const exists = this.state.teachers.some(existing =>
            existing.name.toLowerCase() === (teacher.name || '').toLowerCase()
        );

        if (!exists) {
            const newTeacher = {
                id: String(Date.now() + Math.random()),
                name: teacher.name,
                email: teacher.email || '',
                phone: teacher.phone || '',
                department: teacher.department || ''
            };

            if (this.state.useSupabase) {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('teachers')
                        .insert([{
                            name: newTeacher.name,
                            email: newTeacher.email,
                            phone: newTeacher.phone,
                            department: newTeacher.department
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    // Actualizar ID con el de Supabase
                    newTeacher.id = data.id;
                    console.log('✅ Profesor guardado en Supabase');
                } catch (error) {
                    console.error('❌ Error guardando profesor en Supabase:', error);
                }
            }

            this.state.teachers.push(newTeacher);
            this.saveTeachers();
            return true;
        }
        return false;
    },

    async addTeachers(newTeachers) {
        const addedTeachers = [];
        
        for (const t of newTeachers) {
            const exists = this.state.teachers.some(existing =>
                existing.name.toLowerCase() === (t.name || '').toLowerCase()
            );

            if (!exists) {
                const newTeacher = {
                    id: String(Date.now() + Math.random()),
                    name: t.name,
                    email: t.email || '',
                    phone: t.phone || '',
                    department: t.department || t.options || ''
                };
                addedTeachers.push(newTeacher);
            }
        }

        if (addedTeachers.length > 0) {
            // Guardar en localStorage primero
            this.state.teachers.push(...addedTeachers);
            this.saveTeachers();
            
            // Guardar en Supabase en lotes
            if (this.state.useSupabase) {
                await this.saveTeachersToSupabaseInBatches(addedTeachers);
            }
        }
    },

    // Funcion auxiliar para guardar profesores en lotes
    async saveTeachersToSupabaseInBatches(teachers) {
        const BATCH_SIZE = 50;
        const totalBatches = Math.ceil(teachers.length / BATCH_SIZE);
        
        console.log(`🔄 Guardando ${teachers.length} profesores en ${totalBatches} lotes...`);
        
        for (let i = 0; i < teachers.length; i += BATCH_SIZE) {
            const batch = teachers.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
                const teachersToInsert = batch.map(t => ({
                    name: t.name,
                    email: t.email,
                    phone: t.phone,
                    department: t.department
                }));
                
                const { data, error } = await window.supabaseClient
                    .from('teachers')
                    .insert(teachersToInsert)
                    .select();
                
                if (error) throw error;
                
                // Actualizar IDs con los de Supabase
                data.forEach((savedTeacher, index) => {
                    const teacherIndex = this.state.teachers.findIndex(t => 
                        t.name === batch[index].name &&
                        t.email === batch[index].email
                    );
                    if (teacherIndex !== -1) {
                        this.state.teachers[teacherIndex].id = savedTeacher.id;
                    }
                });
                
                console.log(`✅ Lote ${batchNum}/${totalBatches}: ${batch.length} profesores guardados`);
                
                // Pequeña pausa entre lotes
                if (i + BATCH_SIZE < teachers.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`❌ Error en lote ${batchNum}/${totalBatches}:`, error);
            }
        }
        
        console.log(`🎉 ${teachers.length} profesores procesados.`);
    },

    async removeTeacher(id) {
        const initialCount = this.state.teachers.length;
        
        if (this.state.useSupabase) {
            try {
                const { error } = await window.supabaseClient
                    .from('teachers')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                console.log('✅ Profesor eliminado de Supabase');
            } catch (error) {
                console.error('❌ Error eliminando profesor de Supabase:', error);
            }
        }

        this.state.teachers = this.state.teachers.filter(t => String(t.id) !== String(id));
        
        if (this.state.teachers.length !== initialCount) {
            this.saveTeachers();
            return true;
        }
        return false;
    },

    // ============================================
    // OPERACIONES CRUD - MATERIAS
    // ============================================

    async addSubject(s) {
        const subjectName = (s.subject || s.name || '').toLowerCase();
        const teacherName = (s.teacher || '').toLowerCase();
        const day = s.day || '';
        const time = s.time || '';
        const courseGroup = s.courseGroup || '';

        const exists = this.state.subjects.some(existing => {
            const existingSubject = (existing.subject || existing.name || '').toLowerCase();
            const existingTeacher = (existing.teacher || '').toLowerCase();
            return (
                existingSubject === subjectName &&
                existingTeacher === teacherName &&
                (existing.day || '') === day &&
                (existing.time || '') === time &&
                (existing.courseGroup || '') === courseGroup
            );
        });

        if (!exists) {
            const newSubject = {
                id: String(Date.now() + Math.random()),
                teacher: s.teacher || '',
                day: s.day || '',
                time: s.time || '',
                subject: s.subject || s.name || '',
                courseGroup: s.courseGroup || '',
                code: s.code || '',
                department: s.department || ''
            };

            if (this.state.useSupabase) {
                try {
                    // Buscar el ID del profesor
                    const teacher = this.state.teachers.find(t => 
                        t.name.toLowerCase() === (s.teacher || '').toLowerCase()
                    );
                    
                    const times = (s.time || '').split(' - ');
                    
                    const { data, error } = await window.supabaseClient
                        .from('subjects')
                        .insert([{
                            teacher_id: teacher?.id || null,
                            teacher_name: s.teacher || '',
                            day: s.day || '',
                            time_start: times[0] || '00:00:00',
                            time_end: times[1] || '00:00:00',
                            subject_code: s.subject || s.name || '',
                            course_group: s.courseGroup || '',
                            classroom: s.code || '',
                            department: s.department || ''
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    newSubject.id = data.id;
                    console.log('✅ Materia guardada en Supabase');
                } catch (error) {
                    console.error('❌ Error guardando materia en Supabase:', error);
                }
            }

            this.state.subjects.push(newSubject);
            this.saveSubjects();
        }
    },

    async addSubjects(newSubjects) {
        const addedSubjects = [];
        
        for (const s of newSubjects) {
            const subjectName = (s.subject || s.name || '').toLowerCase();
            const teacherName = (s.teacher || '').toLowerCase();
            const day = s.day || '';
            const time = s.time || '';
            const courseGroup = s.courseGroup || '';

            const exists = this.state.subjects.some(existing => {
                const existingSubject = (existing.subject || existing.name || '').toLowerCase();
                const existingTeacher = (existing.teacher || '').toLowerCase();
                return (
                    existingSubject === subjectName &&
                    existingTeacher === teacherName &&
                    (existing.day || '') === day &&
                    (existing.time || '') === time &&
                    (existing.courseGroup || '') === courseGroup
                );
            });

            if (!exists) {
                addedSubjects.push({
                    id: String(Date.now() + Math.random()),
                    teacher: s.teacher || '',
                    day: s.day || '',
                    time: s.time || '',
                    subject: s.subject || s.name || '',
                    courseGroup: s.courseGroup || '',
                    code: s.code || '',
                    department: s.department || ''
                });
            }
        }

        if (addedSubjects.length > 0) {
            // Guardar en localStorage primero
            this.state.subjects.push(...addedSubjects);
            this.saveSubjects();
            
            // Guardar en Supabase en lotes pequeños para evitar ERR_INSUFFICIENT_RESOURCES
            if (this.state.useSupabase) {
                await this.saveSubjectsToSupabaseInBatches(addedSubjects);
            }
        }
    },

    // Funcion auxiliar para guardar materias en lotes
    async saveSubjectsToSupabaseInBatches(subjects) {
        const BATCH_SIZE = 50; // Procesar 50 materias a la vez
        const totalBatches = Math.ceil(subjects.length / BATCH_SIZE);
        
        console.log(`🔄 Guardando ${subjects.length} materias en ${totalBatches} lotes de ${BATCH_SIZE}...`);
        
        for (let i = 0; i < subjects.length; i += BATCH_SIZE) {
            const batch = subjects.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
                const subjectsToInsert = batch.map(s => {
                    const teacher = this.state.teachers.find(t => 
                        t.name.toLowerCase() === (s.teacher || '').toLowerCase()
                    );
                    const times = (s.time || '').split(' - ');
                    
                    return {
                        teacher_id: teacher?.id || null,
                        teacher_name: s.teacher || '',
                        day: s.day || '',
                        time_start: times[0] || '00:00:00',
                        time_end: times[1] || '00:00:00',
                        subject_code: s.subject || '',
                        course_group: s.courseGroup || '',
                        classroom: s.code || '',
                        department: s.department || ''
                    };
                });
                
                const { data, error } = await window.supabaseClient
                    .from('subjects')
                    .insert(subjectsToInsert)
                    .select();
                
                if (error) throw error;
                
                // Actualizar IDs con los de Supabase
                data.forEach((savedSubject, index) => {
                    const subjectIndex = this.state.subjects.findIndex(s => 
                        s.teacher === batch[index].teacher &&
                        s.day === batch[index].day &&
                        s.time === batch[index].time &&
                        s.subject === batch[index].subject
                    );
                    if (subjectIndex !== -1) {
                        this.state.subjects[subjectIndex].id = savedSubject.id;
                    }
                });
                
                console.log(`✅ Lote ${batchNum}/${totalBatches}: ${batch.length} materias guardadas`);
                
                // Pequeña pausa entre lotes para no saturar el navegador
                if (i + BATCH_SIZE < subjects.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`❌ Error en lote ${batchNum}/${totalBatches}:`, error);
                // Continuar con el siguiente lote incluso si este falla
            }
        }
        
        console.log(`🎉 Proceso completado. ${subjects.length} materias procesadas.`);
    },

    clearSubjects() {
        this.state.subjects = [];
        this.saveSubjects();
    },

    // ============================================
    // OPERACIONES CRUD - SUSTITUCIONES
    // ============================================

    async addSubstitution(sub) {
        const newSub = {
            id: Date.now(),
            status: 'active',
            substitute: null,
            ...sub
        };

        if (this.state.useSupabase) {
            try {
                // Insertar sustitucion principal
                const { data: substitutionData, error: subError } = await window.supabaseClient
                    .from('substitutions')
                    .insert([{
                        teacher_id: sub.teacherId,
                        teacher_name: sub.teacherName,
                        date: sub.date,
                        reason: sub.reason,
                        status: 'active'
                    }])
                    .select()
                    .single();
                
                if (subError) throw subError;
                
                newSub.id = substitutionData.id;
                
                // Insertar schedules si existen
                if (sub.schedule && sub.schedule.length > 0) {
                    const schedulesToInsert = sub.schedule.map(sch => {
                        const times = sch.time ? sch.time.split(' - ') : ['', ''];
                        const substitute = this.state.teachers.find(t => t.name === sch.substitute);
                        const exceptionalSub = this.state.teachers.find(t => t.name === sch.exceptionalSubstitute);
                        
                        return {
                            substitution_id: substitutionData.id,
                            time_start: times[0] || '00:00:00',
                            time_end: times[1] || '00:00:00',
                            subject_code: sch.subject || '',
                            course_group: sch.courseGroup || '',
                            substitute_teacher_id: substitute?.id || null,
                            substitute_name: sch.substitute || '',
                            exceptional_substitute_id: exceptionalSub?.id || null,
                            exceptional_substitute_name: sch.exceptionalSubstitute || '',
                            is_covered: !!sch.substitute
                        };
                    });
                    
                    const { error: schError } = await window.supabaseClient
                        .from('substitution_schedules')
                        .insert(schedulesToInsert);
                    
                    if (schError) throw schError;
                }
                
                console.log('✅ Sustitucion guardada en Supabase');
            } catch (error) {
                console.error('❌ Error guardando sustitucion en Supabase:', error);
            }
        }

        this.state.substitutions.unshift(newSub);
        this.save();
        return newSub;
    },

    async updateSubstitution(id, updates) {
        const index = this.state.substitutions.findIndex(s => String(s.id) === String(id));
        
        if (index !== -1) {
            this.state.substitutions[index] = { 
                ...this.state.substitutions[index], 
                ...updates 
            };

            if (this.state.useSupabase) {
                try {
                    const { error } = await window.supabaseClient
                        .from('substitutions')
                        .update({
                            status: updates.status,
                            reason: updates.reason,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', id);
                    
                    if (error) throw error;
                    console.log('✅ Sustitucion actualizada en Supabase');
                } catch (error) {
                    console.error('❌ Error actualizando sustitucion en Supabase:', error);
                }
            }

            this.save();
        }
    },

    async removeSubstitution(id) {
        const initialCount = this.state.substitutions.length;

        if (this.state.useSupabase) {
            try {
                const { error } = await window.supabaseClient
                    .from('substitutions')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                console.log('✅ Sustitucion eliminada de Supabase');
            } catch (error) {
                console.error('❌ Error eliminando sustitucion de Supabase:', error);
            }
        }

        this.state.substitutions = this.state.substitutions.filter(s => s.id !== id);
        
        if (this.state.substitutions.length !== initialCount) {
            this.save();
            return true;
        }
        return false;
    },

    async removeAllSubstitutionsForTeacherAndDate(teacherId, date) {
        const initialCount = this.state.substitutions.length;
        const subsToDelete = this.state.substitutions.filter(s => 
            String(s.teacherId) === String(teacherId) && s.date === date
        );

        if (this.state.useSupabase) {
            try {
                for (const sub of subsToDelete) {
                    const { error } = await window.supabaseClient
                        .from('substitutions')
                        .delete()
                        .eq('id', sub.id);
                    
                    if (error) throw error;
                }
                console.log(`✅ ${subsToDelete.length} sustituciones eliminadas de Supabase`);
            } catch (error) {
                console.error('❌ Error eliminando sustituciones de Supabase:', error);
            }
        }

        this.state.substitutions = this.state.substitutions.filter(s => 
            !(String(s.teacherId) === String(teacherId) && s.date === date)
        );
        
        if (this.state.substitutions.length !== initialCount) {
            this.save();
            return true;
        }
        return false;
    },

    // ============================================
    // CUADRO DE SUSTITUCIONES (DISPONIBILIDAD)
    // ============================================

    async setSubstitutionSchedule(schedule) {
        this.state.substitutionSchedule = schedule;
        
        if (this.state.useSupabase) {
            try {
                // Primero limpiar registros existentes
                const { error: deleteError } = await window.supabaseClient
                    .from('substitution_availability')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');
                
                if (deleteError) throw deleteError;
                
                // Insertar nuevos registros
                if (schedule.length > 0) {
                    const availabilityToInsert = schedule.map(entry => {
                        const teacher = this.state.teachers.find(t => 
                            t.name.toLowerCase() === (entry.teacher || '').toLowerCase()
                        );
                        
                        return {
                            teacher_id: teacher?.id || null,
                            teacher_name: entry.teacher || '',
                            day: entry.day || '',
                            time_start: entry.startTime || '00:00:00',
                            time_end: entry.endTime || '00:00:00',
                            options: entry.options || ''
                        };
                    });
                    
                    const { error } = await window.supabaseClient
                        .from('substitution_availability')
                        .insert(availabilityToInsert);
                    
                    if (error) throw error;
                    console.log(`✅ ${schedule.length} registros de disponibilidad guardados en Supabase`);
                }
            } catch (error) {
                console.error('❌ Error guardando disponibilidad en Supabase:', error);
            }
        }
        
        this.saveSubstitutionSchedule();
    },

    async addSubstitutionSchedule(entries) {
        const newEntries = [];
        
        entries.forEach(entry => {
            const teacherName = (entry.teacher || '').toLowerCase();
            const day = entry.day || '';
            const startTime = entry.startTime || '';
            const endTime = entry.endTime || '';

            const exists = this.state.substitutionSchedule.some(existing => {
                const existingTeacher = (existing.teacher || '').toLowerCase();
                return (
                    existingTeacher === teacherName &&
                    (existing.day || '') === day &&
                    (existing.startTime || '') === startTime &&
                    (existing.endTime || '') === endTime
                );
            });

            if (!exists) {
                const newEntry = {
                    id: String(Date.now() + Math.random()),
                    teacher: entry.teacher || '',
                    day: entry.day || '',
                    startTime: startTime,
                    endTime: endTime,
                    options: entry.options || ''
                };
                newEntries.push(newEntry);
                this.state.substitutionSchedule.push(newEntry);
            }
        });

        if (newEntries.length > 0 && this.state.useSupabase) {
            try {
                const availabilityToInsert = newEntries.map(entry => {
                    const teacher = this.state.teachers.find(t => 
                        t.name.toLowerCase() === (entry.teacher || '').toLowerCase()
                    );
                    
                    return {
                        teacher_id: teacher?.id || null,
                        teacher_name: entry.teacher || '',
                        day: entry.day || '',
                        time_start: entry.startTime || '00:00:00',
                        time_end: entry.endTime || '00:00:00',
                        options: entry.options || ''
                    };
                });
                
                const { error } = await window.supabaseClient
                    .from('substitution_availability')
                    .insert(availabilityToInsert);
                
                if (error) throw error;
                console.log(`✅ ${newEntries.length} registros de disponibilidad guardados en Supabase`);
            } catch (error) {
                console.error('❌ Error guardando disponibilidad en Supabase:', error);
            }
        }

        this.saveSubstitutionSchedule();
    },

    clearSubstitutionSchedule() {
        this.state.substitutionSchedule = [];
        this.saveSubstitutionSchedule();
    },

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================

    getAvailableSubstitutes(day, time) {
        const canonicalDay = this.getCanonicalDay(day);
        const targetTime = this.timeToMinutes(time);
        
        return this.state.substitutionSchedule.filter(entry => {
            const entryDay = this.getCanonicalDay(entry.day);
            const startMinutes = this.timeToMinutes(entry.startTime);
            const endMinutes = this.timeToMinutes(entry.endTime);
            
            return entryDay === canonicalDay && 
                   targetTime >= startMinutes && 
                   targetTime < endMinutes;
        }).map(entry => entry.teacher);
    },

    getAvailableSubstitutesForRange(day, startTime, endTime) {
        const canonicalDay = this.getCanonicalDay(day);
        const targetStart = this.timeToMinutes(startTime);
        const targetEnd = this.timeToMinutes(endTime);
        
        if (targetStart === -1 || targetEnd === -1) return [];
        
        return this.state.substitutionSchedule.filter(entry => {
            const entryDay = this.getCanonicalDay(entry.day);
            const entryStart = this.timeToMinutes(entry.startTime);
            const entryEnd = this.timeToMinutes(entry.endTime);
            
            const hasOverlap = entryDay === canonicalDay && 
                              targetStart < entryEnd && 
                              entryStart < targetEnd;
            
            return hasOverlap;
        }).map(entry => entry.teacher);
    },

    timeToMinutes(timeStr) {
        if (!timeStr) return -1;
        const parts = timeStr.split(':');
        if (parts.length < 2) return -1;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) return -1;
        return hours * 60 + minutes;
    },

    getCanonicalDay(value) {
        if (!value) return '';
        const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const dayMap = {
            lunes: 'Lunes',
            lun: 'Lunes',
            martes: 'Martes',
            mar: 'Martes',
            miercoles: 'Miercoles',
            mie: 'Miercoles',
            jueves: 'Jueves',
            jue: 'Jueves',
            viernes: 'Viernes',
            vie: 'Viernes'
        };
        return dayMap[normalized] || '';
    },

    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const active = this.state.substitutions.filter(s => s.status === 'active' && s.date === today).length;
        const covered = this.state.substitutions.filter(s => s.status === 'covered' && s.date === today).length;
        return { active, covered, total: active + covered };
    },

    getSubstitutionsByTeacherAndDate(teacherId, date) {
        return this.state.substitutions.filter(s => 
            String(s.teacherId) === String(teacherId) && 
            s.date === date
        );
    },

    findSubstitution(teacherId, date, startTime, endTime) {
        return this.state.substitutions.find(s => 
            String(s.teacherId) === String(teacherId) && 
            s.date === date &&
            s.schedule &&
            s.schedule.some(slot => slot.time === `${startTime} - ${endTime}`)
        );
    },

    // ============================================
    // PERSISTENCIA LOCAL (Fallback)
    // ============================================

    save() {
        localStorage.setItem('substitutions', JSON.stringify(this.state.substitutions));
    },

    saveTeachers() {
        localStorage.setItem('teachers', JSON.stringify(this.state.teachers));
    },

    saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(this.state.subjects));
    },

    saveSubstitutionSchedule() {
        localStorage.setItem('substitutionSchedule', JSON.stringify(this.state.substitutionSchedule));
    },

    // ============================================
    // MIGRACION DE DATOS
    // ============================================

    async migrateToSupabase() {
        if (!this.state.useSupabase) {
            console.warn('Supabase no esta configurado');
            return false;
        }

        console.log('🚀 Iniciando migracion de datos a Supabase...');
        
        try {
            // Migrar profesores
            console.log(`📚 Migrando ${this.state.teachers.length} profesores...`);
            for (const teacher of this.state.teachers) {
                await this.addTeacher(teacher);
            }

            // Migrar materias
            console.log(`📖 Migrando ${this.state.subjects.length} materias...`);
            await this.addSubjects(this.state.subjects);

            // Migrar disponibilidad
            console.log(`📅 Migrando ${this.state.substitutionSchedule.length} registros de disponibilidad...`);
            await this.addSubstitutionSchedule(this.state.substitutionSchedule);

            // Migrar sustituciones
            console.log(`🔄 Migrando ${this.state.substitutions.length} sustituciones...`);
            for (const sub of this.state.substitutions) {
                await this.addSubstitution(sub);
            }

            console.log('🎉 Migracion completada exitosamente!');
            return true;
        } catch (error) {
            console.error('❌ Error en migracion:', error);
            return false;
        }
    },

    exportToJSON() {
        const data = {
            teachers: this.state.teachers,
            subjects: this.state.subjects,
            substitutions: this.state.substitutions,
            substitutionSchedule: this.state.substitutionSchedule,
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
};

// Hacer disponible globalmente
window.store = store;
