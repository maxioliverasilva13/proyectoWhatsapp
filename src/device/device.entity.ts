import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "src/usuario/entities/usuario.entity";

@Entity('dispositivo')
export class Device extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fcmToken: string;

    @ManyToOne(() => Usuario, usuario => usuario.dispositivos, { onDelete: "CASCADE" })
    usuario: Usuario;
}
