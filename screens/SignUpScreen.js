import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, Text, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, SafeAreaView, Image, StatusBar } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }
    if (password.length < 6) {
       Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
       return;
    }
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
        Alert.alert('Error de Registro', error.message);
    } else if (!session) {
        Alert.alert('¡Éxito!', 'Por favor revisa tu bandeja de entrada para verificar la cuenta.');
        navigation.goBack();
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a Lio hoy mismo</Text>
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
              placeholder="Mínimo 6 caracteres"
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
                <TouchableOpacity style={styles.button} onPress={signUpWithEmail} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>
                
                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.6}>
                    <Text style={styles.linkText}>Inicia sesión</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircleTop: {
    position: 'absolute',
    width: 350,
    height: 350,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 175,
    top: -100,
    right: -100,
  },
  bgCircleBottom: {
    position: 'absolute',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
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
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
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
    backgroundColor: '#10b981',
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
});
