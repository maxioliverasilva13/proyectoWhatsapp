import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { EmpresaService } from 'src/empresa/empresa.service';
@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  constructor(private readonly empresaService: EmpresaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('xd2');
    const host = req.headers.host;
    const subdomain = host.split('.')[0];

    if (subdomain === 'app') {
      throw new BadRequestException('Subdominio invalido.');
    }
    const empresaExists = await this.empresaService.findBySubdomain(subdomain);
    if (!empresaExists) {
      throw new BadRequestException('Subdominio invalido');
    }
    req['subdomain'] = subdomain;
    req['empresaId'] = empresaExists?.id;

    next();
  }
}

@Injectable()
export class AppWithoutSubdomainMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    const subdomain = host.split('.')[0];

    console.log('host', host);

    if (subdomain !== 'app' && subdomain !== 'localhost') {
      throw new BadRequestException('Subdominio invalido.');
    }
    next();
  }
}
