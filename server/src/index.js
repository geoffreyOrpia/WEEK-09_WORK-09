import { connectDatabase } from './database.js';
import { createRepository } from './repository.js';
import { createApp } from './app.js';

const startServer = async () => {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  const apiToken = process.env.API_TOKEN ?? '';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !apiToken) {
    throw new Error('Set API_TOKEN before allowing network access with HOST.');
  }
  const { client, db } = await connectDatabase({
    uri: process.env.MONGODB_URI, databaseName: process.env.MONGODB_DB ?? 'orpia_week09',
  });
  const app = createApp({
    repository: createRepository(db), apiToken,
    allowedOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
  });
  const server = app.listen(port, host);
  server.on('listening', () => console.log(`Orpia API ready at http://${host}:${port}; database ${db.databaseName}`));
  server.on('error', async (error) => { await client.close(); console.error(error.message); process.exitCode = 1; });
  const shutdown = () => {
    server.close(async () => { await client.close(); process.exit(0); });
    server.closeIdleConnections();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

startServer().catch(() => {
  console.error('API startup failed. Check Node.js, server/.env, MongoDB, and the configured port.');
  process.exitCode = 1;
});
