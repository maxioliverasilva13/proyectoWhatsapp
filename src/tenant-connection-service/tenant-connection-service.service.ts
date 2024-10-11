import { Injectable, Scope } from '@nestjs/common';
import Docker from 'dockerode';
import * as process from 'process';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  constructor() {}
  async createInfraEmpresa(empresa_prefix: string) {
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
          `SUBDOMAIN=${empresa_prefix}`,
          `VIRTUAL_HOST=${empresa_prefix}.whatsproy.com`,
          `NODE_ENV=prod`,
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
