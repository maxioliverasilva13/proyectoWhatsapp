import { forwardRef, Inject, Injectable, Scope } from '@nestjs/common';
import { EmpresaService } from 'src/empresa/empresa.service';
import { Producto } from 'src/producto/entities/producto.entity';
import {
  handleGetConnectionValues,
  handleGetConnectionValuesToCreateEmpresaDb,
} from 'src/utils/dbConnection';
import { DataSource } from 'typeorm';
import { Client } from 'pg';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private connections: { [key: string]: DataSource } = {};

  constructor(
    @Inject(forwardRef(() => EmpresaService))
    private empresaService: EmpresaService,
  ) {}

  async getConnectionByEmpresa(empresaId: number): Promise<DataSource> {
    const empresa = await this.empresaService.findOne(empresaId);
    if (!this.connections[empresa.db_name]) {
      const defaultConfig = handleGetConnectionValues();
      this.connections[empresa.db_name] = new DataSource({
        ...defaultConfig,
        database: empresa.db_name,
        entities: [Producto],
      });
      await this.connections[empresa.db_name].initialize();
    }
    return this.connections[empresa.db_name];
  }

  async createDB(db_name: string): Promise<boolean> {
    const client = new Client(handleGetConnectionValuesToCreateEmpresaDb());
    await client.connect();

    const result = await client.query(`CREATE DATABASE "${db_name}"`);
    console.log(result);
    console.log(`Base de datos '${db_name}' creada con éxito`);
    await client.end();
    return true;
  }
}
