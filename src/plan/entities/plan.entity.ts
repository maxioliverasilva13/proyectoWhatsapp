import { PlanEmpresa } from "src/planEmpresa/entities/planEmpresa.entity";
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

    @Column({default:false})
    mostPoppular: boolean;

    @OneToMany(()=> PlanEmpresa, (planEmpresa)=> planEmpresa.plan)
    planEmpresa : PlanEmpresa[]
}
