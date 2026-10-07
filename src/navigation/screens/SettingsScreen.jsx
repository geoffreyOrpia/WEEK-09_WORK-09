import React, { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIoT } from '../../context/IoTContext';
import { usePalette } from '../../theme/theme';
import { setAccessTokenProvider } from '../../services/IoTService';
import { Button, Card, Feedback, Screen, Section, ui } from '../../components/UI';

const preferenceOptions = [
  { key: 'darkMode', name: 'Dark appearance', description: 'A softer view for evenings at home.', icon: 'moon-outline' },
  { key: 'autoRefresh', name: 'Automatic refresh', description: 'Update devices and readings every 30 seconds.', icon: 'refresh-outline' },
  { key: 'fahrenheit', name: 'Use Fahrenheit', description: 'Display temperature in °F instead of °C.', icon: 'thermometer-outline' },
];

const SettingsScreen = () => {
  const home = useIoT();
  const palette = usePalette();
  const [draftName, setName] = useState(null);
  const [saved, setSaved] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const name = draftName ?? home.preferences.homeName;

  const changeName = (value) => { setName(value); setSaved(false); };
  const saveName = async () => {
    setSaved(false);
    const success = await home.updatePreferences({ homeName: name.trim() });
    if (success) { setName(null); setSaved(true); }
  };
  const changePreference = (key, value) => { setSaved(false); void home.updatePreferences({ [key]: value }); };
  const checkConnection = () => { void home.refresh(); };
  const connectWithToken = () => {
    const token = accessToken.trim();
    setAccessTokenProvider(async () => token || null);
    setAccessToken('');
    void home.refresh();
  };
  const renderPreference = (option, index) => {
    const togglePreference = (value) => changePreference(option.key, value);
    return <View key={option.key} style={[ui.row, { paddingVertical: 18, borderTopWidth: index ? 1 : 0, borderColor: palette.border }]}>
      <Ionicons name={option.icon} size={24} color={palette.accent} />
      <View style={{ flex: 1 }}><Text style={{ color: palette.text, fontWeight: '600', fontSize: 15 }}>{option.name}</Text><Text style={{ color: palette.muted, lineHeight: 19, fontSize: 12, marginTop: 5 }}>{option.description}</Text></View>
      <Switch accessibilityLabel={option.name} value={home.preferences[option.key]} disabled={home.isSavingPreferences}
        onValueChange={togglePreference} trackColor={{ false: palette.border, true: palette.accent }} thumbColor="#FFFFFF" />
    </View>;
  };

  return <Screen title="Settings" subtitle="Make your home feel like yours.">
    {home.preferenceError && <Feedback message={home.preferenceError} retry={checkConnection} disabled={home.isRefreshing} />}
    <Section title="Your home" /><Card>
      <Text style={[ui.label, { color: palette.text }]}>Home name</Text>
      <TextInput accessibilityLabel="Home name" value={name} maxLength={40} onChangeText={changeName}
        style={[ui.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.bg }]} />
      <View style={[ui.row, { flexWrap: 'wrap' }]}>
        <Button label="Save name" loading={home.isSavingPreferences} disabled={!name.trim() || name.trim() === home.preferences.homeName} onPress={saveName} />
        {saved && <Text accessibilityLiveRegion="polite" style={{ color: palette.accent }}>Home name saved</Text>}
      </View>
    </Card>
    <Section title="Preferences" /><Card>{preferenceOptions.map(renderPreference)}</Card>
    <Section title="Connection" /><Card>
      <View style={[ui.row, { marginBottom: 20 }]}><Ionicons name="wifi-outline" size={28} color={palette.accent} /><View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontWeight: '700', fontSize: 16 }}>{home.gateway?.name ?? 'Home service'}</Text>
        <Text style={{ color: palette.muted, marginTop: 6 }}>{home.isRefreshing ? 'Checking…' : home.isGatewayConnected ? 'Connected' : 'Unavailable'}</Text>
      </View></View>
      <Button label="Check connection" secondary loading={home.isRefreshing} onPress={checkConnection} />
      <Text style={[ui.label, { color: palette.text, marginTop: 20 }]}>Access token (if required)</Text>
      <TextInput accessibilityLabel="API access token" secureTextEntry autoCapitalize="none" autoCorrect={false}
        value={accessToken} onChangeText={setAccessToken} style={[ui.input, { color: palette.text, borderColor: palette.border }]} />
      <Button label="Connect with token" secondary onPress={connectWithToken} disabled={home.isRefreshing} />
    </Card>
    <Card><Text style={{ color: palette.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Orpia Home</Text>
      <Text style={{ color: palette.muted, lineHeight: 22 }}>Your home, saved across visits.</Text>
      <Text style={{ color: palette.muted, fontSize: 12, marginTop: 14 }}>Version 1.0.0</Text>
    </Card>
  </Screen>;
};

export default SettingsScreen;
