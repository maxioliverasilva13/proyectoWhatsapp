import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JsonWebTokenService {

    private secret: string;
    
    constructor(private readonly jwtService: JwtService) {
        this.secret = process.env.JWT_SECRET;
    }

    // Generacion de token  a base a un payload y una expiracion.
    async _generateTokenWithValidity(
        payload: any,
        expiry: string | number,
      ): Promise<string> {
        return this.jwtService.signAsync(payload, { expiresIn: expiry, secret: this.secret });
    }
    
    // Verificación de token válido.
    async _verifyToken(token: string): Promise<any> {
        try {
            return await this.jwtService.verify(token);
        } catch (error) {
            return null;
        }
    }

    async validateToken(token: string){
        try {
            return await this.jwtService.verify(token, {secret: this.secret });
        } catch (error) {
            return null;
        }
    }
}
