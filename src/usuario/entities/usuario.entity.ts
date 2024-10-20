import { Cambioestadopedido } from "src/cambioestadopedido/entities/cambioestadopedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('usuario')
export class Usuario extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => Cambioestadopedido, (cmbe) => cmbe.usuario)
    cambioEstados: Cambioestadopedido[];

    @Column()
    nombre: string;

    @Column()
    apellido: string;

    @Column()
    correo: string;

    @Column()
    password: string;

    @Column()
    id_empresa: number;

    @Column()
    id_rol: number;
    
    @Column()
    activo: boolean;
}
