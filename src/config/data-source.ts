import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

config();
console.log('ayyaz:', path.join(__dirname, '..', 'migrations', '*.{ts,js}'));

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || '[p.b.u.h]',
  database: process.env.DATABASE_NAME || 'BTMS',
  // Entities relative to config folder
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],

  // Migrations relative to config folder
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],

  synchronize: false,
});
