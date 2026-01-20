import { Db, MongoClient } from 'mongodb';

let db: Db | undefined;
let client: MongoClient | undefined;
const inMemoryDocs: Record<string, any[]> = {};

export async function getMongoDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.DASHBOARD_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'test' || process.env.BLOCKCHAIN_IN_MEMORY === 'true') {
      const memoryDb = {
        collection: (name: string) => {
          if (!inMemoryDocs[name]) inMemoryDocs[name] = [];
          return {
            find: () => ({
              sort: () => ({
                toArray: async () => [...inMemoryDocs[name]].sort((a, b) => a.index - b.index),
              }),
            }),
            insertOne: async (doc: any) => {
              inMemoryDocs[name].push(doc);
              return { insertedId: `${doc.index}` };
            },
          };
        },
      } as unknown as Db;
      db = memoryDb;
      return db;
    }
    throw new Error('Mongo URI not defined');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}
