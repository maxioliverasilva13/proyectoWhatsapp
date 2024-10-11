import { Injectable } from '@nestjs/common';
import bcrypt from "bcryptjs";

@Injectable()
export class BcryptService {
    private saltRounds = 10;
    
    compare(plainPassword:string, hash: string):boolean{
        return bcrypt.compareSync(plainPassword, hash);
    }
    
    hashPassword(plainPassword:string): string{
        const hash = bcrypt.hashSync(plainPassword, this.saltRounds);
        return hash;
    }
}
