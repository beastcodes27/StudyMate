import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainNavigator from './src/navigation/MainNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import SetupProfileScreen from './src/screens/SetupProfileScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = '@user_profile';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfileAndDelay = async () => {
      try {
        const profile = await AsyncStorage.getItem(STORAGE_KEY);
        setHasProfile(!!profile);
      } catch (e) {
        console.error('Error checking profile:', e);
      }

      // Ensure we show the loading screen for at least 4 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 4000);
    };

    checkProfileAndDelay();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <AppContent initialHasProfile={hasProfile} />
    </ThemeProvider>
  );
}

const AppContent = ({ initialHasProfile }) => {
  const { theme } = useTheme();
  const [hasProfile, setHasProfile] = useState(initialHasProfile);

  const onSetupComplete = () => {
    setHasProfile(true);
  };

  if (!hasProfile) {
    return <SetupProfileScreen onComplete={onSetupComplete} />;
  }

  const baseTheme = theme.isDark ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.notification,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <MainNavigator />
    </NavigationContainer>
  );
};
