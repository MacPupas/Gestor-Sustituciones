-- ============================================
-- ESTRUCTURA DE BASE DE DATOS PARA SUPABASE
-- Control de Sustituciones
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: teachers (Profesores)
-- ============================================
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE public.teachers IS 'Tabla de profesores del centro educativo';
COMMENT ON COLUMN public.teachers.name IS 'Nombre completo del profesor';
COMMENT ON COLUMN public.teachers.email IS 'Correo electrónico del profesor';
COMMENT ON COLUMN public.teachers.phone IS 'Teléfono de contacto';
COMMENT ON COLUMN public.teachers.department IS 'Departamento o especialidad';

-- ============================================
-- TABLA: subjects (Materias/Asignaturas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(255) NOT NULL, -- Redundancia para consultas rápidas
    day VARCHAR(20) NOT NULL, -- Lunes, Martes, Miércoles, Jueves, Viernes
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    subject_code VARCHAR(50) NOT NULL, -- Código de asignatura (MAT, LCL, etc.)
    subject_name VARCHAR(255), -- Nombre completo de la asignatura
    course_group VARCHAR(100) NOT NULL, -- Curso y grupo (ej: "3º ESO A")
    classroom VARCHAR(50), -- Aula donde se imparte
    department VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.subjects IS 'Horarios de materias impartidas por cada profesor';
COMMENT ON COLUMN public.subjects.day IS 'Día de la semana (Lunes-Viernes)';
COMMENT ON COLUMN public.subjects.time_start IS 'Hora de inicio de la clase';
COMMENT ON COLUMN public.subjects.time_end IS 'Hora de fin de la clase';
COMMENT ON COLUMN public.subjects.subject_code IS 'Código corto de la asignatura';
COMMENT ON COLUMN public.subjects.course_group IS 'Curso y grupo (ej: 3º ESO A)';

-- ============================================
-- TABLA: substitutions (Ausencias y Sustituciones)
-- ============================================
CREATE TABLE IF NOT EXISTS public.substitutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL, -- Enfermedad, Asuntos Propios, etc.
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'covered', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.substitutions IS 'Registro de ausencias de profesores';
COMMENT ON COLUMN public.substitutions.date IS 'Fecha de la ausencia';
COMMENT ON COLUMN public.substitutions.reason IS 'Motivo de la ausencia';
COMMENT ON COLUMN public.substitutions.status IS 'Estado: active, covered, cancelled';

-- ============================================
-- TABLA: substitution_schedules (Detalle de sustituciones por horario)
-- ============================================
CREATE TABLE IF NOT EXISTS public.substitution_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    substitution_id UUID REFERENCES public.substitutions(id) ON DELETE CASCADE,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_code VARCHAR(50),
    course_group VARCHAR(100),
    classroom VARCHAR(50),
    substitute_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    substitute_name VARCHAR(255),
    exceptional_substitute_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    exceptional_substitute_name VARCHAR(255),
    is_covered BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.substitution_schedules IS 'Detalle de cada tramo horario sustituido';
COMMENT ON COLUMN public.substitution_schedules.substitute_teacher_id IS 'Profesor sustituto asignado';
COMMENT ON COLUMN public.substitution_schedules.exceptional_substitute_id IS 'Sustituto para casos excepcionales';
COMMENT ON COLUMN public.substitution_schedules.is_covered IS 'Indica si el tramo ya está cubierto';

-- ============================================
-- TABLA: substitution_availability (Disponibilidad de sustitutos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.substitution_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    teacher_name VARCHAR(255) NOT NULL,
    day VARCHAR(20) NOT NULL, -- Lunes, Martes, etc.
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    options TEXT, -- Opciones adicionales (aulas preferidas, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.substitution_availability IS 'Horarios en los que profesores están disponibles para sustituir';
COMMENT ON COLUMN public.substitution_availability.options IS 'Opciones adicionales (aulas, preferencias)';

-- ============================================
-- TABLA: app_settings (Configuración de la aplicación)
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.app_settings IS 'Configuración general de la aplicación';

-- ============================================
-- TABLA: activity_log (Registro de actividad)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.activity_log IS 'Registro de auditoría de cambios en la base de datos';

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para teachers
CREATE INDEX IF NOT EXISTS idx_teachers_name ON public.teachers(name);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON public.teachers(department);

-- Índices para subjects
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_day ON public.subjects(day);
CREATE INDEX IF NOT EXISTS idx_subjects_course_group ON public.subjects(course_group);
CREATE INDEX IF NOT EXISTS idx_subjects_time_range ON public.subjects(time_start, time_end);

-- Índices para substitutions
CREATE INDEX IF NOT EXISTS idx_substitutions_teacher_id ON public.substitutions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_date ON public.substitutions(date);
CREATE INDEX IF NOT EXISTS idx_substitutions_status ON public.substitutions(status);
CREATE INDEX IF NOT EXISTS idx_substitutions_date_status ON public.substitutions(date, status);

-- Índices para substitution_schedules
CREATE INDEX IF NOT EXISTS idx_sub_schedules_substitution_id ON public.substitution_schedules(substitution_id);
CREATE INDEX IF NOT EXISTS idx_sub_schedules_substitute ON public.substitution_schedules(substitute_teacher_id);
CREATE INDEX IF NOT EXISTS idx_sub_schedules_time ON public.substitution_schedules(time_start, time_end);

-- Índices para substitution_availability
CREATE INDEX IF NOT EXISTS idx_sub_availability_teacher ON public.substitution_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sub_availability_day ON public.substitution_availability(day);
CREATE INDEX IF NOT EXISTS idx_sub_availability_time ON public.substitution_availability(time_start, time_end);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_substitutions_updated_at BEFORE UPDATE ON public.substitutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_schedules_updated_at BEFORE UPDATE ON public.substitution_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_availability_updated_at BEFORE UPDATE ON public.substitution_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitution_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitution_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas para teachers (todos pueden leer, solo autenticados pueden modificar)
CREATE POLICY "Teachers visible to all" ON public.teachers
    FOR SELECT USING (true);

CREATE POLICY "Teachers modifiable by authenticated users" ON public.teachers
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para subjects
CREATE POLICY "Subjects visible to all" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "Subjects modifiable by authenticated users" ON public.subjects
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para substitutions
CREATE POLICY "Substitutions visible to all" ON public.substitutions
    FOR SELECT USING (true);

CREATE POLICY "Substitutions modifiable by authenticated users" ON public.substitutions
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para substitution_schedules
CREATE POLICY "Substitution schedules visible to all" ON public.substitution_schedules
    FOR SELECT USING (true);

CREATE POLICY "Substitution schedules modifiable by authenticated users" ON public.substitution_schedules
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para substitution_availability
CREATE POLICY "Substitution availability visible to all" ON public.substitution_availability
    FOR SELECT USING (true);

CREATE POLICY "Substitution availability modifiable by authenticated users" ON public.substitution_availability
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para app_settings
CREATE POLICY "App settings visible to all" ON public.app_settings
    FOR SELECT USING (true);

CREATE POLICY "App settings modifiable by authenticated users" ON public.app_settings
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para activity_log (solo lectura para todos)
CREATE POLICY "Activity log visible to all" ON public.activity_log
    FOR SELECT USING (true);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar configuraciones por defecto
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
('app_name', 'Control de Sustituciones', 'Nombre de la aplicación'),
('school_name', 'Centro Educativo', 'Nombre del centro educativo'),
('academic_year', '2024-2025', 'Curso académico actual'),
('default_reasons', '["Enfermedad", "Asuntos Propios", "Formación", "Reunión", "Otros"]', 'Motivos de ausencia por defecto'),
('time_slots', '["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00"]', 'Tramos horarios por defecto')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de sustituciones del día actual
CREATE OR REPLACE VIEW today_substitutions AS
SELECT 
    s.id,
    s.teacher_name,
    s.date,
    s.reason,
    s.status,
    COUNT(ss.id) as total_schedules,
    COUNT(CASE WHEN ss.is_covered THEN 1 END) as covered_schedules
FROM public.substitutions s
LEFT JOIN public.substitution_schedules ss ON s.id = ss.substitution_id
WHERE s.date = CURRENT_DATE
GROUP BY s.id, s.teacher_name, s.date, s.reason, s.status;

-- Vista de disponibilidad de sustitutos para hoy
CREATE OR REPLACE VIEW available_substitutes_today AS
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.department,
    sa.time_start,
    sa.time_end,
    sa.options
FROM public.teachers t
JOIN public.substitution_availability sa ON t.id = sa.teacher_id
WHERE sa.day = CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    ELSE 'Fin de semana'
END
AND sa.is_active = TRUE;

-- ============================================
-- PERMISOS
-- ============================================

-- Asegurar que las tablas son accesibles desde la API de Supabase
GRANT ALL ON public.teachers TO anon, authenticated;
GRANT ALL ON public.subjects TO anon, authenticated;
GRANT ALL ON public.substitutions TO anon, authenticated;
GRANT ALL ON public.substitution_schedules TO anon, authenticated;
GRANT ALL ON public.substitution_availability TO anon, authenticated;
GRANT ALL ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.activity_log TO anon, authenticated;

-- Permisos para secuencias
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
