import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const getPort = () => new Promise((resolve, reject) => {
  const listener = createServer();
  listener.once('error', reject);
  listener.listen(0, '127.0.0.1', () => {
    const port = listener.address().port;
    listener.close(() => resolve(port));
  });
});

const startApi = (environment) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, ...environment }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const timer = setTimeout(() => { child.kill(); reject(new Error('API startup timed out.')); }, 15000);
  child.once('error', (error) => { clearTimeout(timer); reject(error); });
  child.once('exit', (code) => { clearTimeout(timer); if (code) reject(new Error(`API exited with code ${code}.`)); });
  child.stdout.on('data', (data) => {
    if (data.toString().includes('Orpia API ready')) { clearTimeout(timer); resolve(child); }
  });
});

const stopApi = (child) => new Promise((resolve) => {
  if (!child || child.exitCode !== null || child.signalCode !== null) { resolve(); return; }
  child.once('exit', resolve);
  child.kill('SIGTERM');
});

test('real MongoDB CRUD, API validation, authentication, concurrency and restart persistence', { timeout: 60000 }, async (t) => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
  const databaseName = `orpia_week09_test_${randomUUID().replaceAll('-', '')}`;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(databaseName);
  let child;
  t.after(async () => {
    await stopApi(child);
    // Only the fresh, randomly named integration-test database is deleted.
    if (!/^orpia_week09_test_[a-f0-9]{32}$/.test(databaseName)) throw new Error('Invalid cleanup target.');
    await db.dropDatabase();
    await client.close();
  });
  const port = await getPort();
  const environment = { MONGODB_URI: uri, MONGODB_DB: databaseName, PORT: String(port), HOST: '127.0.0.1', API_TOKEN: 'integration-only-token', CORS_ORIGINS: 'http://localhost:8081' };
  child = await startApi(environment);
  const request = async (route, method = 'GET', body, headers = {}) => {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      method, headers: { Authorization: 'Bearer integration-only-token', 'Content-Type': 'application/json', ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  };
  assert.equal((await request('/gateway')).data.connected, true);
  assert.deepEqual((await request('/devices')).data, []);
  assert.equal((await request('/sensors')).status, 404);
  assert.equal((await request('/devices', 'GET', null, { Authorization: '' })).status, 401);
  assert.equal((await request('/devices', 'GET', null, { Origin: 'https://untrusted.test' })).status, 403);
  assert.equal((await request('/devices', 'POST', { name: { $ne: '' }, room: 'Study', type: 'light' })).status, 400);
  const created = await request('/devices', 'POST', { name: 'Persistent lamp', room: 'Study', type: 'light' });
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await request(`/devices/${id}`, 'PATCH', { status: true })).data.status, true);
  assert.equal((await request('/preferences', 'PATCH', { homeName: 'Persistent home', darkMode: true })).data.darkMode, true);
  const reading = { temperature: 26.4, humidity: 62, lightLevel: 680, updatedAt: '2026-10-07T00:00:00.000Z' };
  assert.equal((await request('/sensors', 'POST', reading)).status, 201);
  assert.equal(await db.collection('devices').countDocuments({ id, status: true }), 1);
  assert.equal(await db.collection('sensorReadings').countDocuments(), 1);
  const concurrent = await Promise.all(Array.from({ length: 8 }, (_, index) => request('/devices', 'POST', { name: `Concurrent ${index}`, room: 'Test', type: 'fan' })));
  assert.ok(concurrent.every((result) => result.status === 201));
  assert.equal(new Set(concurrent.map((result) => result.data.id)).size, 8);
  await stopApi(child);
  child = await startApi(environment);
  assert.equal((await request('/devices')).data.find((device) => device.id === id).status, true);
  assert.equal((await request('/preferences')).data.homeName, 'Persistent home');
  assert.deepEqual((await request('/sensors')).data, reading);
  await db.collection('devices').updateOne({ id }, { $set: { online: false } });
  assert.equal((await request(`/devices/${id}`, 'PATCH', { status: false })).status, 409);
  assert.equal((await request(`/devices/${id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/devices/${id}`, 'DELETE')).status, 404);
  assert.equal((await request('/devices/-1', 'PATCH', { status: true })).status, 400);
  assert.equal((await request('/preferences', 'PATCH', { $set: { homeName: 'Hacked' } })).status, 400);
});
