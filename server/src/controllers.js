import { validateDevice, validateDeviceId, validatePreferences, validateSensors, validateStatus } from './validation.js';

export const createControllers = (repository) => {
  const getDevices = async (req, res) => res.json(await repository.getDevices());
  const addDevice = async (req, res) => res.status(201).json(await repository.addDevice(validateDevice(req.body)));
  const updateDevice = async (req, res) => {
    const id = validateDeviceId(req.params.id);
    const status = validateStatus(req.body);
    res.json(await repository.updateDeviceStatus(id, status));
  };
  const removeDevice = async (req, res) => {
    await repository.removeDevice(validateDeviceId(req.params.id));
    res.status(204).end();
  };
  const getSensors = async (req, res) => res.json(await repository.getSensorData());
  const addSensors = async (req, res) => res.status(201).json(await repository.addSensorReading(validateSensors(req.body)));
  const getPreferences = async (req, res) => res.json(await repository.getPreferences());
  const updatePreferences = async (req, res) => res.json(await repository.updatePreferences(validatePreferences(req.body)));
  const getGateway = async (req, res) => res.json(await repository.getGateway());
  return { getDevices, addDevice, updateDevice, removeDevice, getSensors,
    addSensors, getPreferences, updatePreferences, getGateway };
};
