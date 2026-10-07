import React from 'react';
import { Text, View } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../theme/theme';
import { useIoT } from '../context/IoTContext';

const CustomDrawerContent = props => {
  const p = usePalette();
  const h = useIoT();
  return <DrawerContentScrollView {...props} contentContainerStyle={{
    flexGrow: 1
  }}>
    <View style={{
      padding: 24,
      paddingTop: 30,
      paddingBottom: 38
    }}>
      <View style={{
        backgroundColor: p.accent,
        borderRadius: 15,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18
      }}><Ionicons name="leaf-outline" size={27} color={p.bg} /></View>
      <Text style={{
        color: p.text,
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 3
      }}>ORPIA</Text><Text style={{
        color: p.muted,
        marginTop: 6,
        fontSize: 12
      }}>A home in harmony.</Text>
    </View><DrawerItemList {...props} />
    <View style={{
      flex: 1,
      minHeight: 70
    }} />
    <View style={{
      margin: 20,
      padding: 18,
      backgroundColor: p.tint,
      borderRadius: 16
    }}><Text style={{
        color: p.accent,
        fontWeight: '700'
      }}>{h.preferences.homeName}</Text><Text style={{
        color: p.muted,
        fontSize: 12,
        lineHeight: 19,
        marginTop: 6
      }}>{h.isGatewayConnected ? 'Your home database is connected' : 'Waiting for the home service'}</Text></View>
  </DrawerContentScrollView>;
};
export default CustomDrawerContent;

