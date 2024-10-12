import { IsEmail } from "class-validator";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Exclude } from "class-transformer";

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    nombre: string;

    @Column()
    @IsEmail()
    email: string;

    @Exclude() // Exluimos el campo password de lecturas.
    @Column()
    password: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updated_at: Date;
}
