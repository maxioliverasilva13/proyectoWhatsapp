import { NestFactory } from '@nestjs/core';
import { SeedService } from './fakeseed.service';
import { SeedModule } from './fakeseed.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seeder = app.get(SeedService);
  await seeder.run();
  await app.close();
}
bootstrap();