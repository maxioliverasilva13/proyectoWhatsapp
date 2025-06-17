import { Injectable, Scope } from '@nestjs/common';
import Docker from 'dockerode';
import * as process from 'process';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  constructor() {}
  async createInfraEmpresa(empresa_prefix: string) {
    try {
      return true;
    } catch (error: any) {
      console.log(`error creating infrasturcutre to ${empresa_prefix}`);
      console.log(error);
      return false;
    }
  }
}
