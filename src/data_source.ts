import { DataSource } from 'typeorm';
import { Config } from './config/constant';

export const AppDataSource = new DataSource({
  type: Config.DB_TYPE as 'postgres',
  host: Config.DB_HOST,
  port: Number(Config.DB_PORT),
  username: Config.DB_USER,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  synchronize: true,
  logging: false,
});
