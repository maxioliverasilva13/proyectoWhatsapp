import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("chatGptThreads")
export class ChatGptThreads extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    numberPhone: string; 

    @Column()
    threadId: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    last_update: Date;

    @Column({ default: false })
    sesionStatus: boolean;

}