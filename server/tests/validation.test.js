import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDevice, validateDeviceId, validatePreferences, validateSensors, validateStatus } from '../src/validation.js';

test('device fields are trimmed and injection/unsupported fields rejected', () => {
  assert.deepEqual(validateDevice({ name: ' Lamp ', room: ' Study ', type: 'light' }), { name: 'Lamp', room: 'Study', type: 'light' });
  [{ name: '', room: 'Study', type: 'light' }, { name: 'Lamp', room: 'Study', type: 'other' },
    { name: { $ne: '' }, room: 'Study', type: 'light' }, { name: 'Lamp', room: 'Study', type: 'light', id: 100 }]
    .forEach((body) => assert.throws(() => validateDevice(body), { status: 400 }));
});

test('ids and status cannot become MongoDB queries', () => {
  ['-1', '0', '1.5', '1e2', '9007199254740992', '$ne'].forEach((id) => assert.throws(() => validateDeviceId(id)));
  assert.equal(validateDeviceId('42'), 42);
  assert.equal(validateStatus({ status: false }), false);
  assert.throws(() => validateStatus({ status: 'true' }));
  assert.throws(() => validateStatus({ status: true, online: true }));
});

test('preferences accept only validated patch fields', () => {
  assert.deepEqual(validatePreferences({ homeName: ' Home ', darkMode: true }), { homeName: 'Home', darkMode: true });
  [{}, { homeName: '' }, { autoRefresh: 'yes' }, { $set: { homeName: 'Hacked' } }]
    .forEach((body) => assert.throws(() => validatePreferences(body)));
});

test('readings require physically valid numbers and timestamps', () => {
  const reading = { temperature: 25, humidity: 50, lightLevel: 200, updatedAt: '2026-10-07T00:00:00Z' };
  assert.equal(validateSensors(reading).updatedAt, '2026-10-07T00:00:00.000Z');
  [{ ...reading, humidity: 101 }, { ...reading, lightLevel: -1 }, { ...reading, temperature: -274 },
    { ...reading, temperature: '25' }, { ...reading, updatedAt: 'invalid' }]
    .forEach((body) => assert.throws(() => validateSensors(body)));
});
