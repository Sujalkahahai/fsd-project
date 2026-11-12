import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load local server/.env file if it exists (for local development)
const envPath = path.resolve('server/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function sanitizeAndEncodeUri(rawUri) {
  let uri = rawUri.trim();
  // Strip outer quotes if present
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Parse mongodb+srv:// or mongodb:// URI
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@]+)$/);
  if (!match) {
    return uri;
  }

  const prefix = match[1];
  const user = match[2];
  const password = match[3];
  const hostAndPath = match[4];

  // URL-encode username and password so special characters (#, @, :, %, etc.) do not corrupt the URI
  return `${prefix}${encodeURIComponent(decodeURIComponent(user))}:${encodeURIComponent(decodeURIComponent(password))}@${hostAndPath}`;
}

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    console.error('MongoDB connection error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  const uri = sanitizeAndEncodeUri(rawUri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
