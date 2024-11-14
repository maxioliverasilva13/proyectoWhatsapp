import { Empresa } from "src/empresa/entities/empresa.entity";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('cierreProvisorio')
export class CierreProvisorio extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', nullable: false })
    inicio: Date


    @Column({ type: 'timestamp', nullable: false })
    final: Date

    @ManyToOne(()=> Empresa, (empresa)=> empresa.cierre_provisorio)
    empresa: Empresa;

}