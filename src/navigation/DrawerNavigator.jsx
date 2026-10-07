import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Text, useWindowDimensions } from 'react-native';
import CustomDrawerContent from './CustomDrawerContent';
import { usePalette } from '../theme/theme';
import { useIoT } from '../context/IoTContext';
const DrawerNavigator = () => {
  const p = usePalette();
  const {
    width
  } = useWindowDimensions();
  const h = useIoT();
  return <Drawer drawerContent={props => <CustomDrawerContent {...props} />} screenOptions={{
    drawerType: width >= 1000 ? 'permanent' : 'front',
    drawerStyle: {
      backgroundColor: p.card,
      width: 264
    },
    drawerActiveBackgroundColor: p.tint,
    drawerActiveTintColor: p.accent,
    drawerInactiveTintColor: p.muted,
    drawerLabelStyle: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: -10
    },
    headerStyle: {
      backgroundColor: p.bg
    },
    headerTintColor: p.text,
    headerShadowVisible: false,
    headerTitle: 'ORPIA / HOME',
    headerTitleStyle: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 2
    },
    headerRight: () => <Text style={{
      color: p.muted,
      fontSize: 11,
      marginRight: 22
    }}>{h.isRefreshing ? 'Syncing…' : h.isGatewayConnected ? '● Connected' : '○ Offline'}</Text>
  }}>
    <Drawer.Screen name="index" options={{
      drawerLabel: 'Overview',
      drawerIcon: ({
        color,
        size
      }) => <Ionicons name="grid-outline" size={size} color={color} />
    }} />
    <Drawer.Screen name="devices" options={{ title: "Devices", drawerLabel: "Devices",
      drawerIcon: ({
        color,
        size
      }) => <Ionicons name="hardware-chip-outline" size={size} color={color} />
    }} />
    <Drawer.Screen name="sensors" options={{ title: "Sensors", drawerLabel: "Sensors",
      drawerIcon: ({
        color,
        size
      }) => <Ionicons name="analytics-outline" size={size} color={color} />
    }} />
    <Drawer.Screen name="settings" options={{ title: "Settings", drawerLabel: "Settings",
      drawerIcon: ({
        color,
        size
      }) => <Ionicons name="settings-outline" size={size} color={color} />
    }} />
  </Drawer>;
};
export default DrawerNavigator;
