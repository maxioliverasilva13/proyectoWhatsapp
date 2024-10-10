import { forwardRef, Inject, Injectable, Scope } from '@nestjs/common';
import { EmpresaService } from 'src/empresa/empresa.service';
import { DataSource } from 'typeorm';
import Docker from 'dockerode';
import { ENTITIES_TO_MAP_EMPRESA_DB } from 'src/utils/db';

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
      const db_port = 5432;
      this.connections[empresa.db_name] = new DataSource({
        type: 'postgres',
        host: `${empresa.db_name}-db`,
        port: db_port,
        synchronize: true,
        username: `${empresa.db_name}_user`,
        password: `${empresa.db_name}_pass`,
        database: `db_${empresa.db_name}`,
        entities: ENTITIES_TO_MAP_EMPRESA_DB,
      });
      await this.connections[empresa.db_name].initialize();
    }
    return this.connections[empresa.db_name];
  }

  async createDB(empresa_prefix: string) {
    try {
      const dbName = `${empresa_prefix}_db`;
      const containerName = `nest_${empresa_prefix}`;
      const docker = new Docker();

      await Docker.createContainer({
        Image: 'postgres:13',
        name: `${dbName}`,
        Env: [
          `POSTGRES_USER=${empresa_prefix}_user`,
          `POSTGRES_PASSWORD=${empresa_prefix}_pass`,
          `POSTGRES_DB=${dbName}`,
        ],
        HostConfig: {
          NetworkMode: 'app-network',
        },
      });

      await docker.createContainer({
        Image: 'nest-backend-image',
        name: containerName,
        Env: [
          `POSTGRES_USER=${process.env.POSTGRES_USER}`,
          `POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD}`,
          `POSTGRES_DB=${process.env.POSTGRES_DB}`,
        ],
        Labels: {
          'traefik.http.routers.company.rule': `Host(\`${empresa_prefix}.whatsproy.com\`)`,
        },
        HostConfig: {
          NetworkMode: 'app-network',
        },
      });

      // Iniciar los contenedores
      await docker.getContainer(dbName).start();
      await docker.getContainer(containerName).start();
      return true;
    } catch (error: any) {
      console.log(`error creating infrasturcutre to ${empresa_prefix}`);
      console.log(error);
      return false;
    }
  }
}
