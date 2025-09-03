import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export default function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }
  return mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}
