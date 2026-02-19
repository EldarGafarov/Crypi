import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

let mongoClient = null;
let isMongoClientConnected = false;

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export const connectToDatabase = async () => {
  const useMongoose = process.env.USE_MONGOOSE === 'true';

  if (useMongoose) {
    // Use Mongoose connection
    if (mongoose.connection.readyState === 1) {
      console.log('Mongoose already connected');
      return { db: mongoose.connection.db }; // Return the database object for Mongoose
    }

    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB via Mongoose');
      return { db: mongoose.connection.db }; // Return the database object
    } catch (error) {
      console.error('Error connecting to MongoDB via Mongoose:', error);
      throw new Error('Mongoose connection failed');
    }
  } else {
    // Use native MongoClient
    if (isMongoClientConnected) {
      console.log('MongoClient already connected');
      return { db: mongoClient.db(process.env.MONGO_DB_NAME) };
    }

    try {
      await client.connect();
      mongoClient = client;
      isMongoClientConnected = true;
      console.log('Connected to MongoDB via MongoClient');
      return { db: mongoClient.db(process.env.MONGO_DB_NAME) };
    } catch (error) {
      console.error('Error connecting to MongoDB via MongoClient:', error);
      throw new Error('MongoClient connection failed');
    }
  }
};

// Properly export the function
export default connectToDatabase;
