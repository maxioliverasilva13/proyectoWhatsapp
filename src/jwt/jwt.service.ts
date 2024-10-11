import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JsonWebTokenService {
    constructor(private readonly jwtService: JwtService) {}

    // Generacion de token  a base a un payload y una expiracion.
    async _generateTokenWithValidity(
        payload: any,
        expiry: string | number,
      ): Promise<string> {
        return this.jwtService.signAsync(payload, { expiresIn: expiry });
    }
    
    // Verificación de token válido.
    async _verifyToken(token: string): Promise<any> {
        try {
            return await this.jwtService.verify(token);
        } catch (error) {
            return null;
        }
    }
}
