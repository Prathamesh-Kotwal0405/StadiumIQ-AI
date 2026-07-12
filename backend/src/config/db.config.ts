import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
// Defensive check: Only treat DATABASE_URL as Postgres if it has a postgres/postgresql protocol scheme
const isPostgres = !!(databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')));

// Ensure the storage path is resolved relative to backend root if it's a relative path
const storagePath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : (process.env.DB_STORAGE 
      ? (path.isAbsolute(process.env.DB_STORAGE) 
          ? process.env.DB_STORAGE 
          : path.resolve(process.cwd(), process.env.DB_STORAGE))
      : path.resolve(process.cwd(), 'stadiumiq.sqlite'));

export const sequelize = isPostgres && databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    });

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    if (isPostgres) {
      console.log('PostgreSQL Cloud Database connected successfully.');
    } else {
      console.log(`SQLite Database connected successfully at: ${storagePath}`);
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
