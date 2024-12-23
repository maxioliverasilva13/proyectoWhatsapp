import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES_TO_MAP_EMPRESA_DB, ENTITIES_TO_MAP_GLOBAL_DB, SEEDERS_TO_MAP_EMPRESA, SEEDERS_TO_MAP_GLOBAL_DB } from './db';
import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';


export const handleGetConnectionValuesToCreateEmpresaDb = () => {
  return {
    host: 'db-global',
    port: Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432),
    database: process.env.DB_DATABASE || 'postgres',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  } as any;
};

export const handleGetConnection = async () => {
  const env = process.env.SUBDOMAIN;
  const params = {
    type: 'postgres',
    host: `${process.env.POSTGRES_GLOBAL_DB_HOST}`,
    port: Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432) || 5432,
    entities:
      env === 'app' ? ENTITIES_TO_MAP_GLOBAL_DB : ENTITIES_TO_MAP_EMPRESA_DB,
    synchronize: true,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ...(process.env.ENV !== 'dev' ? {
      ssl: {
        rejectUnauthorized: false,
      },
    } : {})
  } as any;

  const empresaConnection = new DataSource(params);
  if (!empresaConnection.isInitialized && env !== 'app') {
    await empresaConnection.initialize();
    runSeeders(empresaConnection, {
      seeds: [SEEDERS_TO_MAP_EMPRESA],
    });
    await runSeeders(empresaConnection);
  }

  return TypeOrmModule.forRoot(params);
};

export const handleGetGlobalConnection = async () => {
  const env = process.env.SUBDOMAIN;
  const globalConnection = new DataSource({
    type: 'postgres',
    host: `${process.env.POSTGRES_GLOBAL_DB_HOST}`,
    port: Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432),
    entities: ENTITIES_TO_MAP_GLOBAL_DB,
    name: `${process.env.POSTGRES_DB_GLOBAL}`,
    synchronize: true,
    username: process.env.POSTGRES_USER_GLOBAL,
    password: process.env.POSTGRES_PASSWORD_GLOBAL,
    database: process.env.POSTGRES_DB_GLOBAL,
    ...(process.env.ENV !== 'dev' ? {
      ssl: {
        rejectUnauthorized: false,
      },
    } : {})
  } as any);
  if (!globalConnection.isInitialized) {
    await globalConnection.initialize();

    if (env === 'app') {
      await runSeeders(globalConnection, {
        seeds: [SEEDERS_TO_MAP_GLOBAL_DB],
      });
    }
  }
  return globalConnection;
};

