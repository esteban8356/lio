import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, Text, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, SafeAreaView, Image, StatusBar, Modal } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  async function signInWithEmail() {
    if (!email || !password) {
      showError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      showError('Usuario o contraseña incorrecta.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Elementos decorativos de fondo claros */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.title}>Bienvenido a Lio</Text>
            <Text style={styles.subtitle}>La app todo en uno para tomar el control de tus finanzas, hábitos y entrenamiento diario.</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor="#94a3b8"
              onChangeText={setEmail}
              value={email}
              autoCapitalize={'none'}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              onChangeText={setPassword}
              value={password}
              secureTextEntry
              autoCapitalize={'none'}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            {loading ? (
               <View style={styles.loadingContainer}>
                 <ActivityIndicator size="large" color="#10b981" />
               </View>
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPress={signInWithEmail} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
                
                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.6}>
                    <Text style={styles.linkText}>Regístrate aquí</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Error Personalizado Claro */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIcon}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>¡Oops!</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Fondo gris muy claro casi blanco
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircleTop: {
    position: 'absolute',
    width: 350,
    height: 350,
    backgroundColor: 'rgba(16, 185, 129, 0.05)', // Verde esmeralda muy sutil
    borderRadius: 175,
    top: -100,
    right: -100,
  },
  bgCircleBottom: {
    position: 'absolute',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(59, 130, 246, 0.03)', // Azul sutil
    borderRadius: 250,
    bottom: -150,
    left: -200,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff', // Tarjeta blanca pura
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0', // Borde gris claro
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 22,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a', // Texto principal oscuro
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b', // Texto secundario gris
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  buttonContainer: {
    marginTop: 12,
  },
  loadingContainer: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 56,
    backgroundColor: '#10b981', // Verde esmeralda
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  footerText: {
    color: '#64748b',
    fontSize: 15,
  },
  linkText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  // Modal Claro
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#ef4444', 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
