import mongoose from 'mongoose';
import { Note } from '../models/note.js';

export const connectMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB connection established successfully');

    await Note.syncIndexes();
  } catch (error) {
    console.log('❌ Filed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};
