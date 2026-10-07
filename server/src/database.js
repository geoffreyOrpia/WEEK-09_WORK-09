import { MongoClient } from 'mongodb';

export const defaultPreferences = {
  homeName: 'My home', darkMode: false, autoRefresh: true, fahrenheit: false,
};

export const connectDatabase = async ({ uri, databaseName }) => {
  if (!uri) throw new Error('Set MONGODB_URI in server/.env.');
  if (!databaseName || !/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
    throw new Error('MONGODB_DB must contain only letters, numbers, underscores, or hyphens.');
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });
    await db.collection('devices').createIndex({ id: 1 }, { unique: true });
    await db.collection('sensorReadings').createIndex({ updatedAt: -1 });
    await db.collection('preferences').updateOne(
      { _id: 'home' }, { $setOnInsert: defaultPreferences }, { upsert: true },
    );
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
};
