import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// ============================================
// TRAINING COMPLIANCE SERVICE
// ============================================

/**
 * Sube una imagen a Supabase Storage y registra el día en la base de datos
 */
export const logTrainingDay = async (userId, dateStr, imageUri) => {
  try {
    // 1. Leer el archivo como Base64 usando Expo FileSystem
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Subir la imagen a Supabase Storage (bucket: training_photos)
    // Generar un nombre único basado en fecha y hora
    const fileName = `${userId}/${dateStr}_${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training_photos')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error('Error al subir la imagen.');
    }

    // Obtener la URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
      .from('training_photos')
      .getPublicUrl(fileName);

    // 3. Registrar el cumplimiento en la base de datos
    const { data: logData, error: logError } = await supabase
      .from('training_compliance_logs')
      .upsert({
        user_id: userId,
        training_date: dateStr,
        image_url: publicUrl,
      }, { onConflict: 'user_id, training_date' }) // Si ya subió foto hoy, la reemplaza
      .select()
      .single();

    if (logError) {
      console.error('Error saving log to database:', logError);
      throw new Error('Error al guardar el registro en la base de datos.');
    }

    return logData;
  } catch (err) {
    console.error('logTrainingDay Exception:', err);
    throw err;
  }
};

/**
 * Obtiene todos los registros de entrenamiento de un usuario para pintarlos en el calendario
 */
export const getComplianceLogs = async (userId) => {
  const { data, error } = await supabase
    .from('training_compliance_logs')
    .select('*')
    .eq('user_id', userId)
    .order('training_date', { ascending: true });

  if (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
  
  return data;
};

/**
 * Elimina un registro de cumplimiento (opcional)
 */
export const deleteTrainingLog = async (logId) => {
  const { error } = await supabase
    .from('training_compliance_logs')
    .delete()
    .eq('id', logId);

  if (error) {
    console.error('Error deleting log:', error);
    throw error;
  }
};
