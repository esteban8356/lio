import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const WORKOUTS = [
  { id: '1', title: 'Espalda y Bíceps', level: 'Intermedio', time: '45 min', icon: 'dumbbell' },
  { id: '2', title: 'Piernas de Acero', level: 'Avanzado', time: '60 min', icon: 'running' },
  { id: '3', title: 'Cardio HIIT', level: 'Principiante', time: '20 min', icon: 'heartbeat' },
];

export default function TrainingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rutinas Físicas</Text>
        </View>

        {/* Featured Workout */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Sugerido hoy</Text>
          </View>
          <Text style={styles.featuredTitle}>Pecho y Tríceps</Text>
          <Text style={styles.featuredDesc}>Enfócate en la fuerza y resistencia del tren superior con esta rutina completa.</Text>
          
          <View style={styles.featuredStats}>
            <View style={styles.fStat}>
               <Ionicons name="time-outline" size={16} color="#fff" />
               <Text style={styles.fStatText}>50 min</Text>
            </View>
            <View style={styles.fStat}>
               <Ionicons name="flame-outline" size={16} color="#fff" />
               <Text style={styles.fStatText}>Alta Intensidad</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startBtn} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Comenzar Rutina</Text>
            <Ionicons name="play" size={18} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Mis Rutinas */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mis Rutinas</Text>
          <TouchableOpacity style={styles.addSmallBtn}>
            <Ionicons name="add" size={20} color="#10b981" />
            <Text style={styles.addSmallBtnText}>Crear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.workoutsList}>
          {WORKOUTS.map((workout) => (
            <TouchableOpacity key={workout.id} style={styles.workoutCard} activeOpacity={0.8}>
              <View style={styles.wIconContainer}>
                <FontAwesome5 name={workout.icon} size={20} color="#3b82f6" />
              </View>
              <View style={styles.wInfo}>
                <Text style={styles.wTitle}>{workout.title}</Text>
                <Text style={styles.wDetails}>{workout.level} • {workout.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24, marginTop: Platform.OS === 'android' ? 10 : 0 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  
  // Featured Card
  featuredCard: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  featuredBadgeText: { color: '#ffffff', fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  featuredTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  featuredDesc: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22, marginBottom: 20 },
  featuredStats: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  fStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fStatText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  startBtn: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: { color: '#10b981', fontWeight: '800', fontSize: 16 },

  // List
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addSmallBtnText: { color: '#10b981', fontWeight: '700', fontSize: 15 },
  workoutsList: { gap: 16 },
  workoutCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  wInfo: { flex: 1 },
  wTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  wDetails: { fontSize: 14, color: '#64748b' },
});
