export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const validateObject = (value, allowedKeys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw httpError(400, 'Send a JSON object.');
  }
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    throw httpError(400, 'The request contains unsupported fields.');
  }
  return value;
};

export const validateText = (value, label, maxLength) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw httpError(400, `${label} must contain 1–${maxLength} characters.`);
  }
  return value.trim();
};

export const validateDevice = (body) => {
  validateObject(body, ['name', 'room', 'type']);
  const name = validateText(body.name, 'Device name', 60);
  const room = validateText(body.room, 'Room', 40);
  if (!['light', 'fan', 'lock', 'outlet'].includes(body.type)) {
    throw httpError(400, 'Choose a supported device type.');
  }
  return { name, room, type: body.type };
};

export const validateDeviceId = (value) => {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
    throw httpError(400, 'Invalid device id.');
  }
  return id;
};

export const validateStatus = (body) => {
  validateObject(body, ['status']);
  if (typeof body.status !== 'boolean') throw httpError(400, 'Status must be true or false.');
  return body.status;
};

export const validatePreferences = (body) => {
  validateObject(body, ['homeName', 'darkMode', 'autoRefresh', 'fahrenheit']);
  if (!Object.keys(body).length) throw httpError(400, 'Choose a preference to update.');
  const patch = {};
  if ('homeName' in body) patch.homeName = validateText(body.homeName, 'Home name', 40);
  ['darkMode', 'autoRefresh', 'fahrenheit'].forEach((key) => {
    if (!(key in body)) return;
    if (typeof body[key] !== 'boolean') throw httpError(400, `${key} must be true or false.`);
    patch[key] = body[key];
  });
  return patch;
};

export const validateSensors = (body) => {
  validateObject(body, ['temperature', 'humidity', 'lightLevel', 'updatedAt']);
  const { temperature, humidity, lightLevel } = body;
  if (![temperature, humidity, lightLevel].every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw httpError(400, 'Sensor values must be finite numbers.');
  }
  if (humidity < 0 || humidity > 100 || lightLevel < 0 || temperature < -273.15) {
    throw httpError(400, 'Sensor values are outside their valid range.');
  }
  const updatedAt = body.updatedAt ?? new Date().toISOString();
  if (typeof updatedAt !== 'string' || !Number.isFinite(Date.parse(updatedAt))) {
    throw httpError(400, 'updatedAt must be a valid timestamp.');
  }
  return { temperature, humidity, lightLevel, updatedAt: new Date(updatedAt).toISOString() };
};
