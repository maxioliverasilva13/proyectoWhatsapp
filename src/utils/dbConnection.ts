import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES_TO_MAP_EMPRESA_DB, ENTITIES_TO_MAP_GLOBAL_DB } from './db';
import { DataSource } from 'typeorm';
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
  const env = process.env.SUBDOMAIN;
  const host = env === 'app' ? `${process.env.POSTGRES_GLOBAL_DB_HOST}` : `${env}-db`;
  console.log('xd1', {
    type: 'postgres',
    host: host,
    port: env === 'app' ? Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432) : 5432,
    entities:
      env === 'app' ? ENTITIES_TO_MAP_GLOBAL_DB : ENTITIES_TO_MAP_EMPRESA_DB,
    synchronize: true,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: {
      rejectUnauthorized: false,
    },
  })
  return TypeOrmModule.forRoot({
    type: 'postgres',
    host: host,
    port: env === 'app' ? Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432) : 5432,
    entities:
      env === 'app' ? ENTITIES_TO_MAP_GLOBAL_DB : ENTITIES_TO_MAP_EMPRESA_DB,
    synchronize: true,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: {
      rejectUnauthorized: false,
    },
  });
};

export const handleGetGlobalConnection = async () => {
  const globalConnection = new DataSource({
    type: 'postgres',
    host: 'db-global',
    port: Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432),
    entities: ENTITIES_TO_MAP_GLOBAL_DB,
    name: 'global_db',
    synchronize: true,
    username: process.env.POSTGRES_USER_GLOBAL,
    password: process.env.POSTGRES_PASSWORD_GLOBAL,
    database: process.env.POSTGRES_DB_GLOBAL,
  });
  if (!globalConnection.isInitialized) {
    await globalConnection.initialize();
  }
  return globalConnection;
};
