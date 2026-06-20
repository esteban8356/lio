-- ============================================
-- MÓDULO DE CUMPLIMIENTO FOTOGRÁFICO - LIO APP
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Crear el bucket de almacenamiento para las fotos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training_photos', 
  'training_photos', 
  true, 
  5242880, -- 5MB limit
  '{image/jpeg,image/png,image/webp}'
) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para training_photos
-- Permitir lectura pública a todas las fotos
CREATE POLICY "Public Access for training photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'training_photos');

-- Permitir a usuarios autenticados subir sus propias fotos
CREATE POLICY "Users can upload training photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'training_photos' AND 
    auth.uid() = owner
  );

-- Permitir a usuarios eliminar sus propias fotos
CREATE POLICY "Users can delete own training photos" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'training_photos' AND 
    auth.uid() = owner
  );


-- 2. Tabla de Logs de Cumplimiento
CREATE TABLE IF NOT EXISTS training_compliance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  training_date DATE NOT NULL, -- Fecha en la que entrenó (ej. '2026-06-20')
  image_url TEXT NOT NULL, -- URL pública o path dentro del bucket
  notes TEXT, -- Opcional, por si quiere dejar una nota ese día
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Para asegurar que solo haya 1 registro por día por usuario
  UNIQUE(user_id, training_date)
);

-- Habilitar RLS en la tabla
ALTER TABLE training_compliance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para la tabla (CRUD)
CREATE POLICY "Users can view own compliance logs"
  ON training_compliance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance logs"
  ON training_compliance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own compliance logs"
  ON training_compliance_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own compliance logs"
  ON training_compliance_logs FOR DELETE
  USING (auth.uid() = user_id);
