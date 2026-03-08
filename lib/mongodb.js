import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);
let isConnected = false;

export const connectToDatabase = async () => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return { db: client.db(process.env.MONGO_DB_NAME) };
};

export default connectToDatabase;
