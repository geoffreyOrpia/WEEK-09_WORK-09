import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import { IoTProvider, useIoT } from './src/context/IoTContext';
import { usePalette } from './src/theme/theme';

const Home = () => {
  const home = useIoT();
  const palette = usePalette();
  if (!home.ready) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg }}><ActivityIndicator color={palette.accent} /></View>;
  const base = home.preferences.darkMode ? DarkTheme : DefaultTheme;
  return <ThemeProvider value={{ ...base, colors: { ...base.colors, primary: palette.accent, background: palette.bg, card: palette.card, text: palette.text, border: palette.border } }}>
    <StatusBar style={home.preferences.darkMode ? 'light' : 'dark'} /><DrawerNavigator />
  </ThemeProvider>;
};

const App = () => <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><IoTProvider><Home /></IoTProvider></SafeAreaProvider></GestureHandlerRootView>;
export default App;

