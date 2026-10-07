const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const loadService = (url = '', fetch = async () => { throw Error('Unexpected HTTP request'); }, timers = {}) => {
  const exports = {};
  const code = babel.transformSync(fs.readFileSync('src/services/IoTService.js', 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  vm.runInNewContext(code, {
    exports, process: { env: { EXPO_PUBLIC_API_URL: url } }, fetch,
    AbortController, setTimeout: timers.setTimeout ?? setTimeout, clearTimeout: timers.clearTimeout ?? clearTimeout,
  });
  return exports;
};
const sample = { id: 1, name: 'Lamp', room: 'Study', type: 'light', online: true, status: true };
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
test('HTTP routes, methods, bodies and bearer auth', async () => {
  const calls = [];
  const service = loadService('https://example.test/v1/', async (url, init) => {
    calls.push({ url, ...init });
    if (url.endsWith('/gateway')) return response({ connected: true, name: 'Home' });
    if (url.endsWith('/sensors')) return response({ temperature: 25, humidity: 60, lightLevel: 500, updatedAt: new Date().toISOString() });
    if (init.method === 'DELETE') return response(null, 204);
    return response(init.method === 'GET' ? [sample] : sample);
  });
  service.setAccessTokenProvider(async () => 'test-token');
  await service.iotApi.getDevices(); await service.iotApi.getSensorData(); await service.iotApi.getGateway();
  await service.iotApi.updateDeviceStatus(1, true); await service.iotApi.addDevice({ name: 'Lamp', room: 'Study', type: 'light' }); await service.iotApi.removeDevice(1);
  assert.deepEqual(calls.map(c => c.method), ['GET', 'GET', 'GET', 'PATCH', 'POST', 'DELETE']);
  assert.equal(calls[0].url, 'https://example.test/v1/devices');
  assert.equal(calls[3].body, '{"status":true}');
  assert.ok(calls.every(c => c.headers.Authorization === 'Bearer test-token'));
});
test('invalid and duplicate devices are rejected', async () => {
  for (const data of [{ data: [] }, [{ ...sample, type: 'unknown' }], [sample, sample]]) {
    await assert.rejects(loadService('https://example.test', async () => response(data)).iotApi.getDevices(), /invalid|duplicate/);
  }
});
test('invalid sensors and gateway are rejected', async () => {
  await assert.rejects(loadService('https://example.test', async () => response({ temperature: '25' })).iotApi.getSensorData(), /invalid/);
  await assert.rejects(loadService('https://example.test', async () => response({ connected: 'yes' })).iotApi.getGateway(), /invalid/);
});
test('auth errors and command id mismatches are surfaced', async () => {
  await assert.rejects(loadService('https://example.test', async () => response(null, 401)).iotApi.getDevices(), /request failed/);
  await assert.rejects(loadService('https://example.test', async () => response({ ...sample, id: 2 })).iotApi.updateDeviceStatus(1, true), /different device/);
});
test('aborted requests show a timeout', async () => {
  const service = loadService('https://example.test', async (_, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(Error('aborted')));
  }), { setTimeout: cb => setTimeout(cb, 1), clearTimeout });
  await assert.rejects(service.iotApi.getDevices(), /too long/);
});

test('preferences are fetched and saved through the API', async () => {
  const calls = [];
  const preferences = { homeName: 'My home', darkMode: false, autoRefresh: true, fahrenheit: false };
  const service = loadService('http://localhost:4000', async (url, init) => {
    calls.push({ url, ...init });
    return response({ ...preferences, ...(init.body ? JSON.parse(init.body) : {}) });
  });
  assert.equal((await service.iotApi.getPreferences()).homeName, 'My home');
  assert.equal((await service.iotApi.updatePreferences({ homeName: 'Saved home' })).homeName, 'Saved home');
  assert.equal(calls[1].method, 'PATCH');
  assert.equal(calls[1].url, 'http://localhost:4000/preferences');
  await assert.rejects(loadService('http://localhost:4000', async () => response({ homeName: 42 })).iotApi.getPreferences(), /invalid/);
});

test('backend errors remain visible without sample-data fallback', async () => {
  const service = loadService('http://localhost:4000', async () => response({ message: 'No sensor readings yet.' }, 404));
  await assert.rejects(service.iotApi.getSensorData(), /No sensor readings yet/);
});
