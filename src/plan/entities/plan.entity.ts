import { Empresa } from "src/empresa/entities/empresa.entity";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('plan')
export class Plan extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    nombre: string;

    @Column()
    costoUSD: number;

    @Column()
    diasDuracion: number;

    @Column()
    fecha_inicio: Date;

    @OneToMany(() => Empresa, (empresa) => empresa.plan)
    empresas: Empresa[];
}
