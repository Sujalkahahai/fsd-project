import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB connection error: MONGODB_URI is not defined in server/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`Connected to MongoDB Atlas: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
