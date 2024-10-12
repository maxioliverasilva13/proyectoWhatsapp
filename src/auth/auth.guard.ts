import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, 
    ForbiddenException,} from '@nestjs/common';    
import { JsonWebTokenService } from 'src/jwt/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JsonWebTokenService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      try {
        const request = context.switchToHttp().getRequest();
        const { authorization }: any = request.headers;
        if (!authorization || authorization.trim() === '') {
            throw new UnauthorizedException('Please provide token');
        }
        const authToken = authorization.replace(/bearer/gim, '').trim();
        const user = await this.jwtService.validateToken(authToken);
        if(user == null){
            throw new UnauthorizedException();
        }
        request.userLogged = user;

        return true;
      } catch (error) {
        throw new ForbiddenException(error.message || 'session expired! Please sign In');
      }
    }
  }