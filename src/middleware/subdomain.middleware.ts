import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { EmpresaService } from 'src/empresa/empresa.service';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  constructor(private readonly empresaService: EmpresaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    const subdomain = process.env.SUBDOMAIN || host.split('.')[0];

    if (subdomain === 'app') {
      throw new BadRequestException('Subdominio invalido.');
    }
    const connection = await handleGetGlobalConnection();
    const empresaRepository = connection?.getRepository(Empresa);

    const empresaExists = await empresaRepository.findOne({
      where: { db_name: subdomain },
      relations: ['tipoServicioId']
    });

    if (!empresaExists) {
      throw new BadRequestException('Subdominio invalido');
    }    
    req['subdomain'] = subdomain;
    req['empresaId'] = empresaExists?.id;
    req['empresaType'] = empresaExists?.tipoServicioId?.tipo
    
    next();
  }
}

@Injectable()
export class AppWithoutSubdomainMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    const subdomain = host.split('.')[0];

    if (subdomain !== 'app' && subdomain !== 'localhost') {
      throw new BadRequestException('Subdominio invalido.');
    }
    
    if (subdomain !== 'app' && subdomain !== 'localhost') {
      throw new BadRequestException('Subdominio invalido.');
    }
    next();
  }
}
