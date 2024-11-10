import { Empresa } from "src/empresa/entities/empresa.entity";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('numeroConfianza')
export class NumeroConfianza extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    telefono: number;

    @Column()
    nombre:string;

    @ManyToOne(()=> Empresa, e => e.numeroConfianza)
    empresa: Empresa
}

