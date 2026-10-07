import { httpError } from './validation.js';

export const createRepository = (db) => {
  const devices = db.collection('devices');
  const preferences = db.collection('preferences');
  const readings = db.collection('sensorReadings');
  const projection = { _id: 0 };

  const getDevices = async () => devices.find({}, { projection }).sort({ id: 1 }).toArray();

  const addDevice = async (input) => {
    const counter = await db.collection('counters').findOneAndUpdate(
      { _id: 'devices' }, { $inc: { value: 1 } }, { upsert: true, returnDocument: 'after' },
    );
    if (!Number.isSafeInteger(counter.value)) throw httpError(503, 'Device id capacity exceeded.');
    const device = { ...input, id: counter.value, status: false, online: true };
    await devices.insertOne({ ...device });
    return device;
  };

  const updateDeviceStatus = async (id, status) => {
    const device = await devices.findOneAndUpdate(
      { id, online: true }, { $set: { status } }, { returnDocument: 'after', projection },
    );
    if (device) return device;
    const existing = await devices.findOne({ id });
    throw httpError(existing ? 409 : 404, existing ? 'This device is offline.' : 'Device not found.');
  };

  const removeDevice = async (id) => {
    const result = await devices.deleteOne({ id });
    if (!result.deletedCount) throw httpError(404, 'Device not found.');
  };

  const getSensorData = async () => {
    const reading = await readings.findOne({}, { sort: { updatedAt: -1 }, projection });
    if (!reading) throw httpError(404, 'No sensor readings yet. Connect your sensor gateway to receive measurements.');
    return reading;
  };

  const addSensorReading = async (reading) => {
    await readings.insertOne({ ...reading });
    return reading;
  };

  const getPreferences = async () => preferences.findOne({ _id: 'home' }, { projection });

  const updatePreferences = async (patch) => preferences.findOneAndUpdate(
    { _id: 'home' }, { $set: patch }, { returnDocument: 'after', projection },
  );

  const getGateway = async () => {
    await db.command({ ping: 1 });
    return { connected: true, name: 'Local MongoDB service' };
  };

  return { getDevices, addDevice, updateDeviceStatus, removeDevice, getSensorData,
    addSensorReading, getPreferences, updatePreferences, getGateway };
};

