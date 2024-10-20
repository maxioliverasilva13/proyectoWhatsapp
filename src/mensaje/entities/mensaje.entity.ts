import { Chat } from "src/chat/entities/chat.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('mensaje')
export class Mensaje extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    contenido: string;


    @ManyToOne(() => Chat, (chat) => chat.mensajes)
    chat: Chat;

}
