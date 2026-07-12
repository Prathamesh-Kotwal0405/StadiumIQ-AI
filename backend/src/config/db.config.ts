import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Ensure the storage path is resolved relative to backend root if it's a relative path
const storagePath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : (process.env.DB_STORAGE 
      ? (path.isAbsolute(process.env.DB_STORAGE) 
          ? process.env.DB_STORAGE 
          : path.resolve(process.cwd(), process.env.DB_STORAGE))
      : path.resolve(process.cwd(), 'stadiumiq.sqlite'));

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false, // Disabling console noise for production-ready clean logging
  define: {
    timestamps: true,
    underscored: true
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`SQLite Database connected successfully at: ${storagePath}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
