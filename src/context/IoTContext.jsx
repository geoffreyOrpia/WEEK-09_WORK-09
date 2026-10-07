import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { iotApi } from "../services/IoTService";
const defaults = {
  darkMode: false,
  autoRefresh: true,
  fahrenheit: false,
  homeName: "My home",
};
const useHomeState = () => {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState(null);
  const [isSavingPreferences, setSavingPreferences] = useState(false);
  const savingPreferences = useRef(false);
  const preferenceVersion = useRef(0);
  const loadPreferences = useCallback(async () => {
    if (savingPreferences.current) return;
    const version = preferenceVersion.current;
    try {
      const result = await iotApi.getPreferences();
      if (version !== preferenceVersion.current || savingPreferences.current)
        return;
      setPreferences(result);
      setPreferenceError(null);
    } catch (error) {
      if (version === preferenceVersion.current)
        setPreferenceError(error.message);
    }
  }, []);
  const updatePreferences = useCallback(async (patch) => {
    if (savingPreferences.current) return false;
    savingPreferences.current = true;
    preferenceVersion.current += 1;
    setSavingPreferences(true);
    try {
      const result = await iotApi.updatePreferences(patch);
      setPreferences(result);
      setPreferenceError(null);
      return true;
    } catch (error) {
      setPreferenceError(error.message);
      return false;
    } finally {
      savingPreferences.current = false;
      setSavingPreferences(false);
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      await loadPreferences();
      if (mounted) setReady(true);
    };
    void initialize();
    return () => {
      mounted = false;
    };
  }, [loadPreferences]);
  const [devices, setDevices] = useState([]);
  const devicesRef = useRef([]);
  const commitDevices = useCallback((change) => {
    devicesRef.current = change(devicesRef.current);
    setDevices(devicesRef.current);
  }, []);
  const [sensors, setSensors] = useState(null);
  const [gateway, setGateway] = useState(null);
  const gatewayRef = useRef(null);
  const [isLoadingDevices, setLoadingDevices] = useState(false);
  const [isLoadingSensors, setLoadingSensors] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [sensorError, setSensorError] = useState(null);
  const [gatewayError, setGatewayError] = useState(null);
  const [updatingDeviceIds, setUpdatingIds] = useState([]);
  const pending = useRef(new Set());
  const addingRef = useRef(false);
  const refreshInFlight = useRef(null);
  const [activity, setActivity] = useState([]);
  const activityId = useRef(0);
  const record = (message) =>
    setActivity((a) =>
      [
        {
          id: ++activityId.current,
          message,
          time: new Date().toISOString(),
        },
        ...a,
      ].slice(0, 12),
    );
  const message = (e) =>
    e instanceof Error ? e.message : "Something went wrong. Please try again.";
  const refresh = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;
    if (pending.current.size || addingRef.current) return Promise.resolve();
    const run = async () => {
      setRefreshing(true);
      setGatewayError(null);
      try {
        const g = await iotApi.getGateway();
        gatewayRef.current = g;
        setGateway(g);
        if (!g.connected) {
          setGatewayError(
            "Your gateway is offline. Readings may be out of date.",
          );
          return;
        }
        setLoadingDevices(true);
        setLoadingSensors(true);
        await Promise.all([
          loadPreferences(),
          iotApi
            .getDevices()
            .then((data) => {
              // Commands are blocked during refresh; refresh is skipped while a command is pending.
              if (pending.current.size === 0) commitDevices(() => data);
              setDeviceError(null);
            })
            .catch((e) => setDeviceError(message(e)))
            .finally(() => setLoadingDevices(false)),
          iotApi
            .getSensorData()
            .then((data) => {
              setSensors(data);
              setSensorError(null);
            })
            .catch((e) => setSensorError(message(e)))
            .finally(() => setLoadingSensors(false)),
        ]);
      } catch (e) {
        gatewayRef.current = null;
        setGateway(null);
        setGatewayError(message(e));
      } finally {
        setRefreshing(false);
      }
    };
    refreshInFlight.current = run().finally(() => {
      refreshInFlight.current = null;
    });
    return refreshInFlight.current;
  }, [commitDevices, loadPreferences]);
  const canControl = () => {
    if (!gatewayRef.current?.connected)
      throw new Error("Connect to your gateway before making changes.");
  };
  const toggleDevice = async (id, value) => {
    if (pending.current.has(id) || refreshInFlight.current) return;
    const previous = devicesRef.current.find((d) => d.id === id);
    if (!previous) return;
    try {
      canControl();
      if (!previous.online) throw new Error("This device is offline.");
    } catch (e) {
      setDeviceError(message(e));
      return;
    }
    pending.current.add(id);
    setUpdatingIds([...pending.current]);
    setDeviceError(null);
    commitDevices((ds) =>
      ds.map((d) =>
        d.id === id
          ? {
              ...d,
              status: value,
            }
          : d,
      ),
    );
    try {
      const updated = await iotApi.updateDeviceStatus(id, value);
      commitDevices((ds) => ds.map((d) => (d.id === id ? updated : d)));
      record(
        `${updated.name} ${updated.type === "lock" ? (updated.status ? "locked" : "unlocked") : updated.status ? "turned on" : "turned off"}`,
      );
    } catch (e) {
      commitDevices((ds) => ds.map((d) => (d.id === id ? previous : d)));
      setDeviceError(message(e));
    } finally {
      pending.current.delete(id);
      setUpdatingIds([...pending.current]);
    }
  };
  const addDevice = async (input) => {
    canControl();
    if (refreshInFlight.current || addingRef.current)
      throw new Error("Please wait for the current update to finish.");
    addingRef.current = true;
    try {
      const result = await iotApi.addDevice(input);
      commitDevices((ds) => [...ds.filter((d) => d.id !== result.id), result]);
      record(`${result.name} added to ${result.room}`);
    } finally {
      addingRef.current = false;
    }
  };
  const removeDevice = async (id) => {
    canControl();
    if (refreshInFlight.current || pending.current.has(id))
      throw new Error("Please wait for the current update to finish.");
    const found = devicesRef.current.find((d) => d.id === id);
    pending.current.add(id);
    setUpdatingIds([...pending.current]);
    try {
      await iotApi.removeDevice(id);
      commitDevices((ds) => ds.filter((d) => d.id !== id));
      record(`${found?.name ?? "Device"} removed`);
    } finally {
      pending.current.delete(id);
      setUpdatingIds([...pending.current]);
    }
  };
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);
  useEffect(() => {
    if (!ready || !preferences.autoRefresh) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 30000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [ready, preferences.autoRefresh, refresh]);
  return {
    preferences,
    updatePreferences,
    ready,
    preferenceError,
    isSavingPreferences,
    devices,
    sensors,
    gateway,
    isGatewayConnected: gateway?.connected === true,
    isLoadingDevices,
    isLoadingSensors,
    isRefreshing,
    deviceError,
    sensorError,
    gatewayError,
    updatingDeviceIds,
    activity,
    refresh,
    loadDevices: refresh,
    refreshSensors: refresh,
    toggleDevice,
    addDevice,
    removeDevice,
  };
};
const IoTContext = createContext(null);
export const IoTProvider = ({ children }) => {
  return (
    <IoTContext.Provider value={useHomeState()}>{children}</IoTContext.Provider>
  );
};
export const useIoT = () => {
  const context = useContext(IoTContext);
  if (!context) throw new Error("useIoT must be used inside IoTProvider");
  return context;
};
