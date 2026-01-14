import { MongoClient, Db } from 'mongodb';

let db: Db | undefined;
let client: MongoClient | undefined;

export async function getMongoDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.DASHBOARD_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Mongo URI not defined');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(); // usa la DB definida en la URI
  return db;
}
