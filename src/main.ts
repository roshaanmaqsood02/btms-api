import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const dataSource = app.get(DataSource);

  try {
    await dataSource.query('SELECT 1');
    console.log('Database connected successfully!');
  } catch (e) {
    console.error('Database connection failed:', e);
  }

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await app.listen(configService.get<number>(`PORT`) ?? 4000);
}
bootstrap();
