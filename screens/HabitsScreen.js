import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HABITS = [
  { id: '1', title: 'Beber 2L de Agua', completed: true, streak: 12, icon: 'water-outline', color: '#3b82f6' },
  { id: '2', title: 'Leer 20 páginas', completed: false, streak: 4, icon: 'book-outline', color: '#8b5cf6' },
  { id: '3', title: 'Meditar 10 min', completed: false, streak: 0, icon: 'leaf-outline', color: '#10b981' },
  { id: '4', title: 'Dormir 8 horas', completed: true, streak: 21, icon: 'moon-outline', color: '#6366f1' },
];

export default function HabitsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Control de Hábitos</Text>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Progreso del día */}
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Progreso de Hoy</Text>
            <Text style={styles.progressText}>2 de 4 completados</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercentage}>50%</Text>
          </View>
        </View>

        {/* Lista de Hábitos */}
        <Text style={styles.sectionTitle}>Tus Hábitos</Text>
        <View style={styles.habitsList}>
          {HABITS.map((habit) => (
            <TouchableOpacity key={habit.id} style={styles.habitItem} activeOpacity={0.7}>
              
              <View style={[styles.habitIconBg, { backgroundColor: habit.completed ? habit.color : '#f1f5f9' }]}>
                <Ionicons 
                  name={habit.icon} 
                  size={22} 
                  color={habit.completed ? '#ffffff' : '#64748b'} 
                />
              </View>

              <View style={styles.habitDetails}>
                <Text style={[styles.habitTitle, habit.completed && styles.habitTitleCompleted]}>
                  {habit.title}
                </Text>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {habit.streak} días seguidos</Text>
                </View>
              </View>

              <View style={[styles.checkbox, habit.completed && styles.checkboxCompleted]}>
                {habit.completed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 32,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  progressText: { fontSize: 15, color: '#64748b' },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  habitsList: { gap: 12 },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  habitIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  habitDetails: { flex: 1 },
  habitTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  habitTitleCompleted: { color: '#94a3b8', textDecorationLine: 'line-through' },
  streakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakText: { fontSize: 12, fontWeight: '600', color: '#d97706' },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
});
