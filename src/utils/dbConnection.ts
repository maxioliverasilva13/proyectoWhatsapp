import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';

export const handleGetConnectionValues = () => {
  return {
    type: 'postgres',
    host: 'db-global',
    port: 5432,
    entities: [Empresa],
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
