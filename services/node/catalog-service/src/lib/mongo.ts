import type { FastifyBaseLogger } from 'fastify';
import mongoose from 'mongoose';
import env from '../config/env';

let isConnected = false;

export const connectToDatabase = async (logger?: FastifyBaseLogger) => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
    });
    isConnected = true;
    logger?.info({ db: env.MONGODB_DB }, 'Connected to MongoDB');
  } catch (error) {
    logger?.error({ err: error }, 'Failed to connect to MongoDB');
    throw error;
  }
};

export const disconnectFromDatabase = async () => {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
};

export const isDatabaseConnected = () => isConnected;

