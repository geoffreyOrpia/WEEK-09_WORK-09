const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:4000').trim().replace(/\/$/, '');
let tokenProvider = async () => null;

export const setAccessTokenProvider = (provider) => { tokenProvider = provider; };

const request = async (path, method = 'GET', body) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const token = await tokenProvider();
    const response = await fetch(`${baseUrl}${path}`, {
      method, signal: controller.signal,
      headers: { Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      let errorBody;
      try { errorBody = await response.json(); } catch { errorBody = null; }
      throw new Error(typeof errorBody?.message === 'string' ? errorBody.message
        : `The request failed (${response.status}). Please try again.`);
    }
    return response.status === 204 ? undefined : await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The service took too long to respond. Please try again.');
    if (error instanceof TypeError) throw new Error('Cannot reach the home service. Start the backend and check the API address.');
    throw error;
  } finally { clearTimeout(timeout); }
};

const validateObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The server returned an invalid response.');
  return value;
};

const validateDevice = (value) => {
  const device = validateObject(value);
  if (!Number.isSafeInteger(device.id) || device.id < 1 || typeof device.name !== 'string' || typeof device.room !== 'string'
    || !['light', 'fan', 'lock', 'outlet'].includes(device.type)
    || typeof device.status !== 'boolean' || typeof device.online !== 'boolean') {
    throw new Error('The server returned an invalid device.');
  }
  return device;
};

const validateSensors = (value) => {
  const reading = validateObject(value);
  if (![reading.temperature, reading.humidity, reading.lightLevel].every((n) => typeof n === 'number' && Number.isFinite(n))
    || typeof reading.updatedAt !== 'string' || !Number.isFinite(Date.parse(reading.updatedAt))) {
    throw new Error('The server returned invalid sensor readings.');
  }
  return reading;
};

const validatePreferences = (value) => {
  const preferences = validateObject(value);
  if (typeof preferences.homeName !== 'string' || !preferences.homeName.trim()
    || !['darkMode', 'autoRefresh', 'fahrenheit'].every((key) => typeof preferences[key] === 'boolean')) {
    throw new Error('The server returned invalid preferences.');
  }
  return preferences;
};

const getDevices = async () => {
  const values = await request('/devices');
  if (!Array.isArray(values)) throw new Error('The server returned an invalid device list.');
  const result = values.map(validateDevice);
  if (new Set(result.map((device) => device.id)).size !== result.length) throw new Error('The server returned duplicate devices.');
  return result;
};

const getSensorData = async () => validateSensors(await request('/sensors'));
const getGateway = async () => {
  const value = validateObject(await request('/gateway'));
  if (typeof value.connected !== 'boolean' || typeof value.name !== 'string') throw new Error('The server returned an invalid gateway.');
  return value;
};

const updateDeviceStatus = async (id, status) => {
  const result = validateDevice(await request(`/devices/${id}`, 'PATCH', { status }));
  if (result.id !== id) throw new Error('The server returned a different device.');
  return result;
};

const addDevice = async (input) => validateDevice(await request('/devices', 'POST', input));
const removeDevice = async (id) => { await request(`/devices/${id}`, 'DELETE'); };
const getPreferences = async () => validatePreferences(await request('/preferences'));
const updatePreferences = async (patch) => validatePreferences(await request('/preferences', 'PATCH', patch));

export const iotApi = { getDevices, getSensorData, getGateway, updateDeviceStatus,
  addDevice, removeDevice, getPreferences, updatePreferences };
