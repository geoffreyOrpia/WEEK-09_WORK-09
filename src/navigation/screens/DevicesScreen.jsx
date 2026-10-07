import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useIoT } from '../../context/IoTContext';
import { usePalette } from '../../theme/theme';
import { deviceKinds } from '../../models/IoTModels';
import { Button, DeviceCard, Empty, Feedback, Screen, ui } from '../../components/UI';
const DevicesScreen = () => {
  const h = useIoT();
  const p = usePalette();
  const [search, setSearch] = useState('');
  const [room, setRoom] = useState('All rooms');
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [kind, setKind] = useState('light');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const rooms = ['All rooms', ...Array.from(new Set(h.devices.map(d => d.room))).sort()];
  const shown = h.devices.filter(d => (room === 'All rooms' || d.room === room) && `${d.name} ${d.room} ${deviceKinds[d.type].label}`.toLowerCase().includes(search.toLowerCase()));
  const close = () => {
    if (!busy) {
      setAdding(false);
      setSelected(null);
      setError(null);
      setConfirmRemove(false);
    }
  };
  const add = async () => {
    if (!name.trim() || !newRoom.trim()) {
      setError('Enter a device name and a room.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await h.addDevice({
        name: name.trim(),
        room: newRoom.trim(),
        type: kind
      });
      setAdding(false);
      setName('');
      setNewRoom('');
      setRoom('All rooms');
      setSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add this device.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await h.removeDevice(selected.id);
      setSelected(null);
      setConfirmRemove(false);
      setRoom('All rooms');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove this device.');
    } finally {
      setBusy(false);
    }
  };
  const openAddForm = () => { setError(null); setAdding(true); };
  const openDeviceDetails = (device) => { setError(null); setSelected(device); };
  const confirmRemoval = () => setConfirmRemove(true);
  const cancelRemoval = () => setConfirmRemove(false);
  const refreshDevices = () => { void h.refresh(); };
  const submitDevice = () => { void add(); };
  const submitRemoval = () => { void remove(); };
  const inputStyle = [ui.input, {
    color: p.text,
    borderColor: p.border,
    backgroundColor: p.card
  }];
  return <Screen title="Devices" subtitle="Small controls. A more comfortable home." action={<Button label="+ Add device" onPress={openAddForm} disabled={!h.isGatewayConnected || h.isRefreshing} />}>
    <TextInput accessibilityLabel="Search devices" placeholder="Search devices or rooms" placeholderTextColor={p.muted} value={search} onChangeText={setSearch} style={inputStyle} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{
      marginBottom: 20
    }} contentContainerStyle={{
      gap: 8
    }}>{rooms.map(r => <Pressable key={r} accessibilityRole="button" accessibilityState={{
        selected: r === room
      }} onPress={() => setRoom(r)} style={{
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 22,
        backgroundColor: r === room ? p.accent : p.card,
        borderWidth: 1,
        borderColor: p.border
      }}><Text style={{
          color: r === room ? p.bg : p.muted,
          fontWeight: '600'
        }}>{r}</Text></Pressable>)}</ScrollView>
    <Text style={{
      color: p.muted,
      marginBottom: 18,
      fontSize: 12
    }}>{shown.length} devices · {h.devices.filter(d => d.online).length} online</Text>
    {h.deviceError && <Feedback message={h.deviceError} retry={refreshDevices} disabled={h.isRefreshing} />}
    {shown.length ? <View style={ui.wrap}>{shown.map(device => <DeviceCard key={device.id} device={device} onDetails={() => openDeviceDetails(device)} />)}</View> : <Empty loading={h.isRefreshing} title={h.isRefreshing ? 'Loading devices' : h.devices.length ? 'No matching devices' : 'Make yourself at home'} description={h.devices.length ? 'Try another search or room.' : 'Add a device to start controlling your home.'} />}
    <Modal visible={adding || selected !== null} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{
        flex: 1,
        backgroundColor: '#00000080',
        justifyContent: 'center',
        padding: 20
      }}>
        <View accessibilityViewIsModal style={{
          backgroundColor: p.bg,
          borderRadius: 24,
          padding: 24,
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          maxHeight: '90%'
        }}>
          <ScrollView keyboardShouldPersistTaps="handled"><View style={[ui.row, {
              justifyContent: 'space-between',
              marginBottom: 16
            }]}>
            <Text style={{
                color: p.text,
                fontSize: 22,
                fontWeight: '700',
                flex: 1
              }}>{adding ? 'Add a device' : selected?.name}</Text><Button label="Close" secondary disabled={busy} onPress={close} /></View>
            {error && <Feedback message={error} />}
            {adding ? <>
              <Text style={{
                color: p.muted,
                lineHeight: 21,
                marginBottom: 20
              }}>Give your device a name, choose its room, and select its type.</Text>
              <Text style={[ui.label, {
                color: p.text
              }]}>Device name</Text><TextInput accessibilityLabel="Device name" autoFocus maxLength={60} editable={!busy} value={name} onChangeText={setName} placeholder="e.g. Reading lamp" placeholderTextColor={p.muted} style={inputStyle} />
              <Text style={[ui.label, {
                color: p.text
              }]}>Room</Text><TextInput accessibilityLabel="Room" maxLength={40} editable={!busy} value={newRoom} onChangeText={setNewRoom} placeholder="e.g. Living room" placeholderTextColor={p.muted} style={inputStyle} />
              <Text style={[ui.label, {
                color: p.text
              }]}>Device type</Text><View style={[ui.wrap, {
                marginBottom: 24
              }]}>{Object.keys(deviceKinds).map(k => <Button key={k} label={deviceKinds[k].label} secondary={kind !== k} disabled={busy} onPress={() => setKind(k)} />)}</View>
              <Button label="Add device" loading={busy} onPress={submitDevice} disabled={!h.isGatewayConnected || h.isRefreshing} />
            </> : selected && <>
              <Text style={{
                color: p.muted,
                marginBottom: 20,
                lineHeight: 22
              }}>{selected.room} · {deviceKinds[selected.type].label}{'\n'}{selected.online ? 'Device online' : 'Device offline'}</Text>
              <Text style={{
                color: p.muted,
                lineHeight: 22,
                marginBottom: 24
              }}>Removing a device removes it from your home’s device list. To add it again, register it with your gateway.</Text>
              {confirmRemove ? <><Text style={{
                  color: p.danger,
                  fontWeight: '600',
                  marginBottom: 16
                }}>Remove {selected.name} from your home?</Text><Button label="Confirm removal" loading={busy} onPress={submitRemoval} /><View style={{
                  height: 10
                }} /><Button label="Keep device" secondary disabled={busy} onPress={cancelRemoval} /></> : <Button label="Remove device" secondary disabled={!h.isGatewayConnected || h.isRefreshing || h.updatingDeviceIds.includes(selected.id)} onPress={confirmRemoval} />}
            </>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </Screen>;
};
export default DevicesScreen;
