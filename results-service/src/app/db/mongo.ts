import { MongoClient, Db } from 'mongodb';

const uri = process.env.DASHBOARD_MONGO_URI || process.env.MONGO_URI;

if (!uri) {
  throw new Error('Mongo URI not defined');
}

const client = new MongoClient(uri);

let db: Db;

export async function getMongoDb(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db(); // usa la DB definida en la URI
  }
  return db;
}