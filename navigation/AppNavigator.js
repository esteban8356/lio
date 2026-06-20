import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FinanceScreen from '../screens/FinanceScreen';
import HabitsScreen from '../screens/HabitsScreen';
import WorkoutScreen from '../screens/WorkoutScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawer({ route }) {
  const { session } = route.params || {};
  return (
    <Drawer.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0f172a',
        drawerStyle: { backgroundColor: '#ffffff' },
        drawerActiveTintColor: '#10b981',
        drawerInactiveTintColor: '#475569',
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        initialParams={{ session }}
        options={{
           title: 'Resumen General',
           drawerIcon: ({ color, size }) => <Ionicons name="apps-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Finanzas" 
        component={FinanceScreen} 
        options={{
           title: 'Mis Finanzas',
           drawerIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Habitos" 
        component={HabitsScreen} 
        options={{
           title: 'Control de Hábitos',
           drawerIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Entrenamiento" 
        component={WorkoutScreen} 
        options={{
           title: 'Rutinas Físicas',
           drawerIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={size} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <Stack.Screen 
            name="Main" 
            component={MainDrawer} 
            initialParams={{ session }} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen} 
              options={{ title: 'Registro', headerBackTitle: 'Volver', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#0f172a' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
