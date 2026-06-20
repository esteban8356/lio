import { supabase } from './supabase';

const EXERCISE_DB_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';
const EXERCISES_JSON_URL = `${EXERCISE_DB_BASE_URL}/dist/exercises.json`;
const EXERCISE_IMAGE_URL = `${EXERCISE_DB_BASE_URL}/exercises`;

// Cache de ejercicios para no descargar el JSON cada vez
let exercisesCache = null;

// ============================================
// EJERCICIOS (free-exercise-db)
// ============================================

export const fetchAllExercises = async () => {
  if (exercisesCache) return exercisesCache;
  try {
    const response = await fetch(EXERCISES_JSON_URL);
    const data = await response.json();
    exercisesCache = data;
    return data;
  } catch (e) {
    console.log('Error fetching exercises:', e);
    return [];
  }
};

export const getExerciseImageUrl = (imagePath) => {
  return `${EXERCISE_IMAGE_URL}/${imagePath}`;
};

export const getExercisesByMuscle = async (muscle) => {
  const all = await fetchAllExercises();
  return all.filter(ex => 
    ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
  );
};

export const getExercisesByEquipment = async (equipment) => {
  const all = await fetchAllExercises();
  return all.filter(ex => ex.equipment === equipment);
};

export const searchExercises = async (query) => {
  const all = await fetchAllExercises();
  const q = query.toLowerCase();
  return all.filter(ex => ex.name.toLowerCase().includes(q));
};

export const getAllMuscleGroups = () => [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
  'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
  'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders',
  'traps', 'triceps'
];

export const getMuscleLabel = (muscle) => {
  const labels = {
    'abdominals': 'Abdominales',
    'abductors': 'Abductores',
    'adductors': 'Aductores',
    'biceps': 'Bíceps',
    'calves': 'Pantorrillas',
    'chest': 'Pecho',
    'forearms': 'Antebrazos',
    'glutes': 'Glúteos',
    'hamstrings': 'Isquiotibiales',
    'lats': 'Dorsales',
    'lower back': 'Lumbar',
    'middle back': 'Espalda Media',
    'neck': 'Cuello',
    'quadriceps': 'Cuádriceps',
    'shoulders': 'Hombros',
    'traps': 'Trapecios',
    'triceps': 'Tríceps',
  };
  return labels[muscle] || muscle;
};

// ============================================
// RUTINAS (Supabase)
// ============================================

export const getRoutines = async (userId) => {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createRoutine = async (userId, name, description, difficulty, estimatedMinutes, muscleGroup) => {
  const { data, error } = await supabase
    .from('routines')
    .insert({
      user_id: userId,
      name,
      description,
      difficulty,
      estimated_minutes: estimatedMinutes,
      muscle_group: muscleGroup,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteRoutine = async (routineId) => {
  const { error } = await supabase
    .from('routines')
    .update({ is_active: false })
    .eq('id', routineId);
  if (error) throw error;
};

// ============================================
// EJERCICIOS DE RUTINA (Supabase)
// ============================================

export const getRoutineExercises = async (routineId) => {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('*')
    .eq('routine_id', routineId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
};

export const addExerciseToRoutine = async (routineId, exercise, sets = 3, reps = 12, restSeconds = 60) => {
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({
      routine_id: routineId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_image: exercise.images?.[0] || null,
      sets,
      reps,
      rest_seconds: restSeconds,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const removeExerciseFromRoutine = async (exerciseRowId) => {
  const { error } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('id', exerciseRowId);
  if (error) throw error;
};

// ============================================
// SESIONES DE ENTRENAMIENTO (Supabase)
// ============================================

export const startWorkoutSession = async (userId, routineId, routineName, totalExercises) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      routine_id: routineId,
      routine_name: routineName,
      total_exercises: totalExercises,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const finishWorkoutSession = async (sessionId, completedExercises, durationMinutes, mood, notes) => {
  const { error } = await supabase
    .from('workout_sessions')
    .update({
      finished_at: new Date().toISOString(),
      completed_exercises: completedExercises,
      duration_minutes: durationMinutes,
      mood,
      notes,
    })
    .eq('id', sessionId);
  if (error) throw error;
};

export const getWorkoutHistory = async (userId, limit = 20) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const logExerciseSet = async (sessionId, exerciseId, exerciseName, setNumber, repsDone, weightUsed) => {
  const { data, error } = await supabase
    .from('workout_exercise_logs')
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      set_number: setNumber,
      reps_done: repsDone,
      weight_used: weightUsed,
      completed: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};
