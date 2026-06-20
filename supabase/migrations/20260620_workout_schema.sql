-- ============================================
-- MÓDULO DE RUTINAS FÍSICAS - LIO APP
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de Rutinas del usuario
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('principiante', 'intermedio', 'avanzado')) DEFAULT 'intermedio',
  estimated_minutes INTEGER DEFAULT 45,
  muscle_group TEXT, -- ej: "Pecho y Tríceps", "Espalda y Bíceps", "Piernas"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Ejercicios dentro de cada Rutina
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL, -- ID del ejercicio en free-exercise-db (ej: "Barbell_Bench_Press")
  exercise_name TEXT NOT NULL,
  exercise_image TEXT, -- ruta de la imagen (ej: "Barbell_Bench_Press/0.jpg")
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 12,
  rest_seconds INTEGER DEFAULT 60,
  weight DECIMAL(10,2), -- peso en kg/lb (opcional)
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Sesiones de Entrenamiento (Historial)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  routine_name TEXT, -- Guardamos el nombre por si la rutina se borra
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  notes TEXT,
  mood TEXT CHECK (mood IN ('excelente', 'bien', 'normal', 'cansado', 'agotado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Ejercicios completados en cada sesión
CREATE TABLE IF NOT EXISTS workout_exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps_done INTEGER,
  weight_used DECIMAL(10,2),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercise_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para ROUTINES
CREATE POLICY "Users can view own routines"
  ON routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own routines"
  ON routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routines FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para ROUTINE_EXERCISES
CREATE POLICY "Users can view exercises of own routines"
  ON routine_exercises FOR SELECT
  USING (routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid()));

CREATE POLICY "Users can add exercises to own routines"
  ON routine_exercises FOR INSERT
  WITH CHECK (routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid()));

CREATE POLICY "Users can update exercises of own routines"
  ON routine_exercises FOR UPDATE
  USING (routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete exercises of own routines"
  ON routine_exercises FOR DELETE
  USING (routine_id IN (SELECT id FROM routines WHERE user_id = auth.uid()));

-- Políticas para WORKOUT_SESSIONS
CREATE POLICY "Users can view own sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para WORKOUT_EXERCISE_LOGS
CREATE POLICY "Users can view own exercise logs"
  ON workout_exercise_logs FOR SELECT
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own exercise logs"
  ON workout_exercise_logs FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own exercise logs"
  ON workout_exercise_logs FOR UPDATE
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own exercise logs"
  ON workout_exercise_logs FOR DELETE
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));
