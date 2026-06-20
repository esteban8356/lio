import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Modal, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as complianceService from '../lib/complianceService';
import * as ImagePicker from 'expo-image-picker';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function WorkoutScreen() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Photo Viewer Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const userLogs = await complianceService.getComplianceLogs(session.user.id);
        setLogs(userLogs);
      }
    } catch (err) {
      console.log('Error loading compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIC: Image Picker & Upload
  // ==========================================

  const handlePickImage = async () => {
    try {
      // Pedir permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false && cameraPermissionResult.granted === false) {
        Alert.alert('Permiso denegado', 'Necesitas dar permisos de cámara o galería para subir la foto.');
        return;
      }

      // Preguntar al usuario si quiere cámara o galería
      Alert.alert(
        'Evidencia de Entrenamiento',
        '¿De dónde quieres obtener la foto?',
        [
          {
            text: 'Tomar Foto',
            onPress: () => openPicker('camera'),
          },
          {
            text: 'Elegir de la Galería',
            onPress: () => openPicker('gallery'),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          }
        ]
      );
    } catch (error) {
      console.log('Error with permissions:', error);
    }
  };

  const openPicker = async (source) => {
    try {
      let result;
      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
      };

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Hubo un problema al abrir la cámara/galería.');
    }
  };

  const uploadPhoto = async (imageUri) => {
    if (!userId) return;
    
    // Obtener la fecha local en formato YYYY-MM-DD
    const today = new Date();
    // Ajustar por timezone local para evitar que se guarde con un día distinto al que el usuario ve
    const dateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    setIsUploading(true);
    try {
      const newLog = await complianceService.logTrainingDay(userId, dateStr, imageUri);
      
      // Actualizar estado local
      setLogs(prevLogs => {
        // Remover si ya existía un log para hoy (reemplazo)
        const filtered = prevLogs.filter(log => log.training_date !== dateStr);
        return [...filtered, newLog];
      });
      
      Alert.alert('¡Excelente!', 'Tu entrenamiento de hoy ha sido registrado.');
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('Error', 'No se pudo subir la foto. Asegúrate de tener conexión y de haber creado el bucket en Supabase.');
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  // LOGIC: Calendar Generation
  // ==========================================

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Crear el array de celdas del calendario
  const calendarCells = [];
  
  // Días vacíos al inicio (del mes anterior)
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ empty: true, key: `empty-start-${i}` });
  }
  
  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(currentYear, currentMonth, i);
    const dateStr = new Date(dayDate.getTime() - (dayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    // Buscar si hay un log para este día
    const logForDay = logs.find(log => log.training_date === dateStr);
    
    const isToday = new Date().toDateString() === dayDate.toDateString();
    
    calendarCells.push({
      empty: false,
      day: i,
      dateStr,
      log: logForDay,
      isToday,
      key: `day-${i}`
    });
  }

  // Rellenar días vacíos al final para completar la cuadrícula
  const remainingCells = 42 - calendarCells.length; // 6 filas x 7 días = 42
  for (let i = 0; i < remainingCells; i++) {
    calendarCells.push({ empty: true, key: `empty-end-${i}` });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cumplimiento</Text>
            <Text style={styles.subtitle}>No rompas la cadena 🔥</Text>
          </View>
          <View style={styles.statsBadge}>
            <Ionicons name="flame" size={20} color="#f59e0b" />
            <Text style={styles.statsText}>{logs.length} Días</Text>
          </View>
        </View>

        {/* Calendar Control */}
        <View style={styles.calendarControl}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-forward" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Days of week header */}
          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cell) => {
              if (cell.empty) {
                return <View key={cell.key} style={styles.dayCell} />;
              }

              const isCompleted = !!cell.log;

              return (
                <TouchableOpacity 
                  key={cell.key} 
                  style={[
                    styles.dayCell, 
                    isCompleted && styles.dayCellCompleted,
                    cell.isToday && !isCompleted && styles.dayCellToday
                  ]}
                  activeOpacity={isCompleted ? 0.7 : 1}
                  onPress={() => isCompleted ? setSelectedLog(cell.log) : null}
                >
                  <Text style={[
                    styles.dayNumber,
                    isCompleted && styles.dayNumberCompleted,
                    cell.isToday && !isCompleted && styles.dayNumberToday
                  ]}>
                    {cell.day}
                  </Text>
                  
                  {isCompleted && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Big Action Button */}
        <TouchableOpacity 
          style={styles.mainActionBtn} 
          onPress={handlePickImage}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="camera" size={28} color="#ffffff" />
              <Text style={styles.mainActionBtnText}>Registrar Hoy</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Photo Viewer Modal */}
      {selectedLog && (
        <Modal transparent visible={!!selectedLog} animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.closeModalArea} onPress={() => setSelectedLog(null)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Entrenamiento</Text>
                <TouchableOpacity onPress={() => setSelectedLog(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalDate}>
                {new Date(selectedLog.training_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: selectedLog.image_url }} 
                  style={styles.logImage} 
                  resizeMode="cover"
                />
              </View>
              
              <View style={styles.successMessage}>
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text style={styles.successText}>¡Día completado con éxito!</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: Platform.OS === 'android' ? 10 : 0 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  statsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  statsText: { fontSize: 16, fontWeight: '700', color: '#b45309' },

  calendarControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#ffffff', padding: 8, borderRadius: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  monthBtn: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 14 },
  monthText: { fontSize: 20, fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' },

  calendarContainer: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, marginBottom: 32 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  weekDayText: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  dayCell: { width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 12 },
  dayCellToday: { backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#10b981' },
  dayCellCompleted: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  
  dayNumber: { fontSize: 16, fontWeight: '600', color: '#475569' },
  dayNumberToday: { color: '#10b981', fontWeight: '800' },
  dayNumberCompleted: { color: '#ffffff', fontWeight: '800' },
  
  checkmarkContainer: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#059669', borderRadius: 10, borderWidth: 2, borderColor: '#ffffff', padding: 2 },

  mainActionBtn: { backgroundColor: '#10b981', paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6, gap: 12 },
  mainActionBtnText: { color: '#ffffff', fontSize: 20, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  closeModalArea: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { backgroundColor: '#ffffff', width: '100%', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 14 },
  modalDate: { fontSize: 16, color: '#64748b', textTransform: 'capitalize', marginBottom: 24 },
  
  imageContainer: { width: '100%', aspectRatio: 4/5, borderRadius: 24, overflow: 'hidden', backgroundColor: '#f1f5f9', marginBottom: 24 },
  logImage: { width: '100%', height: '100%' },
  
  successMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef3c7', paddingVertical: 12, borderRadius: 16 },
  successText: { fontSize: 16, fontWeight: '700', color: '#b45309' },
});
