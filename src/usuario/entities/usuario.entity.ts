import { Cambioestadopedido } from "src/cambioestadopedido/entities/cambioestadopedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('usuario')
@Unique(['correo'])
export class Usuario extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    apellido: string;

    @Column()
    correo: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    id_empresa: number;

    @Column()
    id_rol: number;
    
    @Column({ nullable: true })
    activo: boolean;
}
