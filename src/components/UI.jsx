import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "../theme/theme";
import { useIoT } from "../context/IoTContext";
import { deviceKinds } from "../models/IoTModels";

export const ui = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    fontSize: 19,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 48,
    marginBottom: 16,
  },
});
export const Screen = ({ children, title, subtitle, action }) => {
  const p = usePalette();
  const home = useIoT();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: p.bg,
      }}
      contentContainerStyle={{
        padding: 22,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={home.isRefreshing}
          onRefresh={() => void home.refresh()}
          tintColor={p.accent}
        />
      }
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1120,
          alignSelf: "center",
          gap: 4,
        }}
      >
        <View
          style={[
            ui.row,
            {
              justifyContent: "space-between",
              flexWrap: "wrap",
              marginBottom: 22,
            },
          ]}
        >
          <View
            style={{
              flexShrink: 1,
            }}
          >
            <Text
              style={[
                ui.title,
                {
                  color: p.text,
                },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                ui.subtitle,
                {
                  color: p.muted,
                },
              ]}
            >
              {subtitle}
            </Text>
          </View>
          {action}
        </View>

        {home.gatewayError && (
          <Feedback
            message={home.gatewayError}
            retry={() => void home.refresh()}
            disabled={home.isRefreshing}
          />
        )}
        {children}
      </View>
    </ScrollView>
  );
};
export const Button = ({ label, onPress, disabled, loading, secondary }) => {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!disabled || !!loading,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: secondary ? p.tint : p.accent,
        borderRadius: 12,
        minHeight: 46,
        paddingHorizontal: 18,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: disabled || loading ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      {loading && (
        <ActivityIndicator size="small" color={secondary ? p.accent : p.bg} />
      )}
      <Text
        style={{
          color: secondary ? p.accent : p.bg,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};
export const Card = ({ children }) => {
  const p = usePalette();
  return (
    <View
      style={[
        ui.card,
        {
          backgroundColor: p.card,
          borderColor: p.border,
        },
      ]}
    >
      {children}
    </View>
  );
};
export const Feedback = ({ message, retry, disabled }) => {
  const p = usePalette();
  return (
    <View
      accessibilityRole="alert"
      style={[
        ui.card,
        {
          borderColor: p.danger,
          backgroundColor: p.card,
          gap: 12,
        },
      ]}
    >
      <View style={ui.row}>
        <Ionicons name="alert-circle-outline" color={p.danger} size={22} />
        <Text
          style={{
            color: p.danger,
            flex: 1,
            lineHeight: 21,
          }}
        >
          {message}
        </Text>
      </View>
      {retry && (
        <View
          style={{
            alignSelf: "flex-start",
          }}
        >
          <Button
            label="Try again"
            onPress={retry}
            disabled={disabled}
            secondary
          />
        </View>
      )}
    </View>
  );
};
export const Empty = ({ title, description, loading }) => {
  const p = usePalette();
  return (
    <Card>
      <View
        style={{
          alignItems: "center",
          padding: 24,
          gap: 12,
        }}
      >
        {loading ? (
          <ActivityIndicator color={p.accent} />
        ) : (
          <Ionicons name="leaf-outline" size={32} color={p.accent} />
        )}
        <Text
          style={{
            color: p.text,
            fontWeight: "700",
            fontSize: 17,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: p.muted,
            textAlign: "center",
            lineHeight: 21,
          }}
        >
          {description}
        </Text>
      </View>
    </Card>
  );
};
export const DeviceCard = ({ device, onDetails }) => {
  const p = usePalette();
  const home = useIoT();
  const busy = home.updatingDeviceIds.includes(device.id);
  const locked = device.type === "lock";
  const state = busy
    ? "Updating…"
    : !device.online
      ? "Offline"
      : locked
        ? device.status
          ? "Locked"
          : "Unlocked"
        : device.status
          ? "On"
          : "Off";
  return (
    <View
      style={[
        ui.card,
        {
          borderColor: p.border,
          backgroundColor: p.card,
          flex: 1,
          minWidth: 245,
          marginBottom: 0,
        },
      ]}
    >
      <View
        style={[
          ui.row,
          {
            justifyContent: "space-between",
            marginBottom: 24,
          },
        ]}
      >
        <View
          style={{
            backgroundColor: device.status ? p.tint : p.bg,
            padding: 12,
            borderRadius: 14,
          }}
        >
          <Ionicons
            name={deviceKinds[device.type].icon}
            size={26}
            color={p.accent}
          />
        </View>
        <Switch
          accessibilityLabel={`${device.name} ${locked ? "lock" : "power"}`}
          value={device.status}
          disabled={
            !device.online ||
            !home.isGatewayConnected ||
            busy ||
            home.isRefreshing
          }
          trackColor={{
            false: p.border,
            true: p.accent,
          }}
          thumbColor="#FFFFFF"
          onValueChange={(value) => void home.toggleDevice(device.id, value)}
        />
      </View>
      <Text
        style={{
          color: p.text,
          fontSize: 17,
          fontWeight: "700",
          marginBottom: 5,
        }}
      >
        {device.name}
      </Text>
      <Text
        style={{
          color: p.muted,
          fontSize: 12,
        }}
      >
        {device.room} · {deviceKinds[device.type].label}
      </Text>
      <View
        style={[
          ui.row,
          {
            justifyContent: "space-between",
            marginTop: 18,
          },
        ]}
      >
        <Text
          style={{
            color: device.status && device.online ? p.accent : p.muted,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {state}
        </Text>
        {onDetails && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Manage ${device.name}`}
            onPress={onDetails}
            hitSlop={10}
          >
            <Text
              style={{
                color: p.accent,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Manage ↗
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
export const SensorTiles = () => {
  const p = usePalette();
  const { sensors, preferences, isLoadingSensors } = useIoT();
  const values = [
    {
      label: "Temperature",
      icon: "thermometer-outline",
      value: sensors
        ? preferences.fahrenheit
          ? ((sensors.temperature * 9) / 5 + 32).toFixed(1)
          : sensors.temperature.toFixed(1)
        : "—",
      unit: preferences.fahrenheit ? "°F" : "°C",
      hint: "Room temperature",
    },
    {
      label: "Humidity",
      icon: "water-outline",
      value: sensors ? String(sensors.humidity) : "—",
      unit: "%",
      hint: "Relative humidity",
    },
    {
      label: "Light level",
      icon: "sunny-outline",
      value: sensors ? String(sensors.lightLevel) : "—",
      unit: "lx",
      hint: "Ambient brightness",
    },
  ];
  return (
    <View
      style={[
        ui.wrap,
        {
          marginBottom: 20,
        },
      ]}
    >
      {values.map((v) => (
        <View
          key={v.label}
          style={[
            ui.card,
            {
              flex: 1,
              minWidth: 150,
              backgroundColor: p.card,
              borderColor: p.border,
              marginBottom: 0,
            },
          ]}
        >
          <Ionicons name={v.icon} size={23} color={p.accent} />
          <Text
            style={{
              color: p.muted,
              marginTop: 18,
              fontSize: 13,
            }}
          >
            {v.label}
          </Text>
          {isLoadingSensors && !sensors ? (
            <ActivityIndicator
              color={p.accent}
              style={{
                marginVertical: 16,
              }}
            />
          ) : (
            <Text
              style={{
                color: p.text,
                fontSize: 32,
                fontWeight: "600",
                marginVertical: 10,
              }}
            >
              {v.value}
              <Text
                style={{
                  color: p.muted,
                  fontSize: 17,
                }}
              >
                {" "}
                {v.unit}
              </Text>
            </Text>
          )}
          <Text
            style={{
              color: p.muted,
              fontSize: 12,
            }}
          >
            {v.hint}
          </Text>
        </View>
      ))}
    </View>
  );
};
export const Section = ({ title, action }) => {
  const p = usePalette();
  return (
    <View
      style={[
        ui.row,
        {
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 4,
        },
      ]}
    >
      <Text
        style={[
          ui.section,
          {
            color: p.text,
          },
        ]}
      >
        {title}
      </Text>
      {action}
    </View>
  );
};
