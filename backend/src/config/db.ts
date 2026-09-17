import mongoose from 'mongoose';
import logger from './logger';

const user = encodeURIComponent(process.env.MONGODB_USER || '');
const pass = encodeURIComponent(process.env.MONGODB_USER_PASSWORD || '');
const dbName = process.env.MONGODB_DATABASE;
const host = process.env.MONGODB_HOST || '2407_mongodb';
const mongoUrl = `mongodb://${user}:${pass}@${host}:27017/${dbName}?authSource=admin`;

const connectDB = async (): Promise<void> => {
	try {
		await mongoose.connect(mongoUrl);
		logger.info('MongoDB connected');
	} catch (error) {
		logger.error('MongoDB connection error', { error });
		process.exit(1);
	}
};

export default connectDB;
