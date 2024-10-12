import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptService {
    private saltRounds = 10;
    
    async compare(plainPassword:string, hash: string): Promise<boolean>{
        return await bcrypt.compare(plainPassword, hash);
    }
    
    async hashPassword(plainPassword:string): Promise<string>{
        const hash = await bcrypt.hash(plainPassword, this.saltRounds);
        return hash;
    }
}
