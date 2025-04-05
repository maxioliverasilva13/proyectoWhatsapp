import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "src/usuario/entities/usuario.entity";

@Entity('dispositivo')
export class Device extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fcmToken: string;

    @OneToOne(() => Usuario, usuario => usuario.dispositivo, { onDelete: "CASCADE" })
    usuario: Usuario;
}
