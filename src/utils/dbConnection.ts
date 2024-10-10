import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES_TO_MAP_GLOBAL_DB } from './db';
import * as process from 'process';

export const handleGetConnectionValues = () => {
  return {
    type: 'postgres',
    host: 'db-global',
    port: 5432,
    entities: ENTITIES_TO_MAP_GLOBAL_DB,
    synchronize: true,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  } as any;
};

export const handleGetConnectionValuesToCreateEmpresaDb = () => {
  return {
    host: 'db-global',
    port: 5432,
    database: process.env.DB_DATABASE || 'postgres',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  } as any;
};

export const handleGetConnection = () => {
  const configParams = handleGetConnectionValues();
  return TypeOrmModule.forRoot(configParams as any);
};
