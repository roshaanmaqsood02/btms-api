import * as dotenv from 'dotenv';
dotenv.config();

export const Config = {
  DB_TYPE: `postgres`,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
};
