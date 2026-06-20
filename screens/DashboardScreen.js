import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function DashboardScreen({ route }) {
  const { session } = route.params || {};
  
  const userEmail = session?.user?.email || '';
  const userName = userEmail ? userEmail.split('@')[0] : 'Usuario';

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, {userName}!</Text>
            <Text style={styles.dateText}>Hoy es un gran día para progresar</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={signOut} activeOpacity={0.7}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.logoutBadge}>
               <Ionicons name="log-out" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Finanzas Card */}
        <Text style={styles.sectionTitle}>Tus Finanzas</Text>
        <View style={styles.financeCard}>
          <View style={styles.financeHeader}>
            <View style={styles.iconContainerBlue}>
              <FontAwesome5 name="wallet" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.financeTrend}>+5.2% este mes</Text>
          </View>
          <Text style={styles.balanceLabel}>Balance Total</Text>
          <Text style={styles.balanceAmount}>$12,450.00</Text>
          <View style={styles.financeActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="arrow-down" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Ingreso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
              <Ionicons name="arrow-up" size={18} color="#475569" />
              <Text style={styles.actionBtnTextOutline}>Gasto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hábitos Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Hábitos de Hoy</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>Ver todos</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitsScroll}>
          
          <View style={styles.habitCard}>
            <View style={styles.habitIconGreen}>
               <Ionicons name="water" size={24} color="#10b981" />
            </View>
            <Text style={styles.habitTitle}>Beber Agua</Text>
            <Text style={styles.habitProgress}>2 / 3 Litros</Text>
            <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: '66%', backgroundColor: '#10b981' }]} />
            </View>
          </View>

          <View style={styles.habitCard}>
            <View style={styles.habitIconPurple}>
               <Ionicons name="book" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.habitTitle}>Lectura</Text>
            <Text style={styles.habitProgress}>15 / 30 Min</Text>
            <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: '50%', backgroundColor: '#8b5cf6' }]} />
            </View>
          </View>

        </ScrollView>

        {/* Entrenamiento Section */}
        <Text style={styles.sectionTitle}>Entrenamiento</Text>
        <TouchableOpacity style={styles.trainingCard} activeOpacity={0.8}>
          <View style={styles.trainingInfo}>
            <Text style={styles.trainingSubtitle}>Rutina del día</Text>
            <Text style={styles.trainingTitle}>Día de Pierna y Core</Text>
            <Text style={styles.trainingDetails}>45 min • Alta intensidad</Text>
          </View>
          <View style={styles.playButton}>
             <Ionicons name="play" size={24} color="#10b981" style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Fondo general claro
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  profileBtn: {
    position: 'relative',
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0', // Borde gris en lugar de verde fuerte
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  logoutBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    marginTop: 10,
  },
  seeAllText: {
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 16,
  },
  
  // Finance Card
  financeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    // Sombras sutiles para fondo blanco
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainerBlue: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  financeTrend: {
    color: '#10b981',
    fontWeight: '600',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 24,
  },
  financeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10b981', // Verde principal
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionBtnTextOutline: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Habits
  habitsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: 160,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  habitIconGreen: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitIconPurple: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  habitProgress: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 14,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Training
  trainingCard: {
    backgroundColor: '#10b981', // Este se mantiene verde para resaltar
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  trainingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trainingDetails: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff', // Fondo blanco para que destaque
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
});
