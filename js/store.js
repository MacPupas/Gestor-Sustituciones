const store = {
    state: {
        teachers: [],
        substitutions: [],
        subjects: [],
        substitutionSchedule: [] // Cuadro de sustituciones: disponibilidad por hora
    },

    init() {
        const savedTeachers = localStorage.getItem('teachers');
        if (savedTeachers) {
            this.state.teachers = JSON.parse(savedTeachers);
        } else {
            this.state.teachers = [
                { id: '1', name: 'María García', department: 'Matemáticas' },
                { id: '2', name: 'Juan López', department: 'Lengua' },
                { id: '3', name: 'Ana Martínez', department: 'Inglés' },
                { id: '4', name: 'Carlos Ruiz', department: 'Historia' }
            ];
            this.saveTeachers();
        }

        const savedSubjects = localStorage.getItem('subjects');
        if (savedSubjects) {
            this.state.subjects = JSON.parse(savedSubjects);
        } else {
            this.state.subjects = [];
        }

        const savedSchedule = localStorage.getItem('substitutionSchedule');
        if (savedSchedule) {
            this.state.substitutionSchedule = JSON.parse(savedSchedule);
        } else {
            this.state.substitutionSchedule = [];
        }

        const savedSubs = localStorage.getItem('substitutions');
        if (savedSubs) {
            this.state.substitutions = JSON.parse(savedSubs);
        } else {
            this.state.substitutions = [
                {
                    id: 1,
                    teacherId: 1,
                    teacherName: 'María García',
                    date: new Date().toISOString().split('T')[0],
                    reason: 'Enfermedad',
                    status: 'active',
                    substitute: null
                }
            ];
            this.save();
        }
    },

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

    setSubstitutionSchedule(schedule) {
        this.state.substitutionSchedule = schedule;
        this.saveSubstitutionSchedule();
    },

    addSubstitutionSchedule(entries) {
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
                this.state.substitutionSchedule.push({
                    id: String(Date.now() + Math.random()),
                    teacher: entry.teacher || '',
                    day: entry.day || '',
                    startTime: startTime,
                    endTime: endTime,
                    options: entry.options || '' // Campo opciones importado
                });
            }
        });
        this.saveSubstitutionSchedule();
    },

    clearSubstitutionSchedule() {
        this.state.substitutionSchedule = [];
        this.saveSubstitutionSchedule();
    },

    // Obtener profesores disponibles para sustituir en un día y hora específicos
    // Ahora busca si la hora está dentro del rango [startTime, endTime]
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

    // Obtener profesores disponibles para sustituir en un día y rango de horas
    // Busca si hay solapamiento entre el rango solicitado y el rango del cuadro
    getAvailableSubstitutesForRange(day, startTime, endTime) {
        const canonicalDay = this.getCanonicalDay(day);
        const targetStart = this.timeToMinutes(startTime);
        const targetEnd = this.timeToMinutes(endTime);
        
        // Si no hay horas válidas, retornar array vacío
        if (targetStart === -1 || targetEnd === -1) return [];
        
        return this.state.substitutionSchedule.filter(entry => {
            const entryDay = this.getCanonicalDay(entry.day);
            const entryStart = this.timeToMinutes(entry.startTime);
            const entryEnd = this.timeToMinutes(entry.endTime);
            
            // Verificar si hay solapamiento entre los rangos
            // Dos rangos [A, B] y [C, D] se solapan si: A < D && C < B
            const hasOverlap = entryDay === canonicalDay && 
                              targetStart < entryEnd && 
                              entryStart < targetEnd;
            
            return hasOverlap;
        }).map(entry => entry.teacher);
    },

    // Convierte hora HH:MM a minutos desde medianoche
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
            miercoles: 'Miércoles',
            mie: 'Miércoles',
            jueves: 'Jueves',
            jue: 'Jueves',
            viernes: 'Viernes',
            vie: 'Viernes'
        };
        return dayMap[normalized] || '';
    },

    addTeacher(teacher) {
        // Check if teacher already exists with same name
        const exists = this.state.teachers.some(existing =>
            existing.name.toLowerCase() === (teacher.name || '').toLowerCase()
        );

        if (!exists) {
            this.state.teachers.push({
                id: String(Date.now() + Math.random()),
                name: teacher.name,
                email: teacher.email || '',
                phone: teacher.phone || '',
                department: teacher.department || ''
            });
            this.saveTeachers();
            return true;
        }
        return false;
    },

    addTeachers(newTeachers) {
        newTeachers.forEach(t => {
            // Check if teacher already exists with same name and schedule to avoid duplicates
            const exists = this.state.teachers.some(existing =>
                existing.name.toLowerCase() === t.name.toLowerCase() &&
                existing.day === t.day &&
                existing.startTime === t.startTime
            );

            if (!exists) {
                this.state.teachers.push({
                    id: String(Date.now() + Math.random()),
                    name: t.name,
                    day: t.day || '',
                    startTime: t.startTime || '',
                    endTime: t.endTime || '',
                    options: t.options || '',
                    department: t.options || '' // Keep department for backward compatibility
                });
            }
        });
        this.saveTeachers();
    },

    addSubject(s) {
        // Agregar una sola materia
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
            this.state.subjects.push({
                id: String(Date.now() + Math.random()),
                teacher: s.teacher || '',
                day: s.day || '',
                time: s.time || '',
                subject: s.subject || s.name || '',
                courseGroup: s.courseGroup || '',
                code: s.code || '',
                department: s.department || ''
            });
            this.saveSubjects(); // Guardar materias en localStorage
        }
    },

    addSubjects(newSubjects) {
        newSubjects.forEach(s => {
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
                this.state.subjects.push({
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
        });
        this.saveSubjects();
    },

    clearSubjects() {
        this.state.subjects = [];
        this.saveSubjects();
    },

    removeTeacher(id) {
        const initialCount = this.state.teachers.length;
        this.state.teachers = this.state.teachers.filter(t => String(t.id) !== String(id));
        if (this.state.teachers.length !== initialCount) {
            this.saveTeachers();
            return true;
        }
        return false;
    },

    addSubstitution(sub) {
        const newSub = {
            id: Date.now(),
            status: 'active',
            substitute: null,
            ...sub
        };
        this.state.substitutions.unshift(newSub);
        this.save();
    },

    updateSubstitution(id, updates) {
        const index = this.state.substitutions.findIndex(s => String(s.id) === String(id));
        if (index !== -1) {
            this.state.substitutions[index] = { ...this.state.substitutions[index], ...updates };
            this.save();
        }
    },

    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const active = this.state.substitutions.filter(s => s.status === 'active' && s.date === today).length;
        const covered = this.state.substitutions.filter(s => s.status === 'covered' && s.date === today).length;
        return { active, covered, total: active + covered };
    },

    // Obtener sustituciones de un profesor en una fecha específica
    getSubstitutionsByTeacherAndDate(teacherId, date) {
        return this.state.substitutions.filter(s => 
            String(s.teacherId) === String(teacherId) && 
            s.date === date
        );
    },

    // Buscar sustitución por profesor, fecha y rango horario
    findSubstitution(teacherId, date, startTime, endTime) {
        return this.state.substitutions.find(s => 
            String(s.teacherId) === String(teacherId) && 
            s.date === date &&
            s.schedule &&
            s.schedule.some(slot => slot.time === `${startTime} - ${endTime}`)
        );
    },

    // Eliminar una sustitución por ID
    removeSubstitution(id) {
        const initialCount = this.state.substitutions.length;
        this.state.substitutions = this.state.substitutions.filter(s => s.id !== id);
        if (this.state.substitutions.length !== initialCount) {
            this.save();
            return true;
        }
        return false;
    },

    // Eliminar todas las sustituciones de un profesor en una fecha
    removeAllSubstitutionsForTeacherAndDate(teacherId, date) {
        const initialCount = this.state.substitutions.length;
        this.state.substitutions = this.state.substitutions.filter(s => 
            !(String(s.teacherId) === String(teacherId) && s.date === date)
        );
        if (this.state.substitutions.length !== initialCount) {
            this.save();
            return true;
        }
        return false;
    }
};
