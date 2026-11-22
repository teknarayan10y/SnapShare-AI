import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapshare', {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    console.log(`[SnapShare Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[SnapShare Database Error] Could not connect to MongoDB: ${error.message}`);
    console.warn(`[SnapShare Database] Ensure local mongod is running on 127.0.0.1:27017 or check MONGODB_URI in .env`);
    return null;
  }
};
