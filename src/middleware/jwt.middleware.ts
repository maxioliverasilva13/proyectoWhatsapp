// src/auth/jwt.middleware.ts
import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as any;
      if (decoded) {
        const connection = await handleGetGlobalConnection();
        const subdomain = process.env.SUBDOMAIN;
        const empresaRepository = connection?.getRepository(Empresa);
        const tokenEmpresaId = decoded?.empresaId;
        req['empresaId'] = tokenEmpresaId;
     
        // check if role is admin or not
         const empresaExists = await empresaRepository.findOne({
           where: { db_name: subdomain },
           relations: ['tipoServicioId']
         });
         if (subdomain !== 'app') {
          if ((empresaExists?.id !== tokenEmpresaId) || (!empresaExists?.id || !tokenEmpresaId)) {
            connection.destroy();
            throw new HttpException("No tienes permiso para esta empresa", 401);
           }
         }
        (req as any).user = decoded;
        connection.destroy();
      }
      next();
    } catch (err) {
    console.log(err);
      return res.status(401).json({ message: err?.message || 'Token inválido' });
    }
  }
}
