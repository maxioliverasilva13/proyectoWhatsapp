import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator'; // Importamos el decorador
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Role } from 'src/roles/entities/role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const connection = await handleGetGlobalConnection();

    try {
      const usuarioRepository = connection?.getRepository(Usuario);
      const roleRepository = connection?.getRepository(Role);
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      if (user) {
        const userItem = await usuarioRepository.findOne({
          where: { id: Number(user?.userId ?? 0) },
        });
        if (!userItem) {
          throw new ForbiddenException('Invalid user');
        }
        const roleItem = await roleRepository.findOne({
          where: { id: userItem?.id_rol },
        });
        if (!roleItem) {
          throw new ForbiddenException('Invalid role');
        }
  
        const hasRole = requiredRoles?.includes(roleItem?.tipo);
        if (!hasRole) {
          throw new ForbiddenException('Acceso denegado');
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
    } finally {
      connection.destroy();
    }
  }
}
