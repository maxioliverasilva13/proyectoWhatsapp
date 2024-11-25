import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn, JoinColumn } from "typeorm";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Plan } from "src/plan/entities/plan.entity";

@Entity()
export class PlanEmpresa extends BaseEntity {
    @PrimaryColumn()
    id_empresa: number;

    @PrimaryColumn()
    id_plan: number;

    @PrimaryColumn({ type: 'date' })
    fecha_inicio: Date;

    @ManyToOne(() => Empresa, empresa => empresa.planEmpresa)
    @JoinColumn({ name: "id_empresa" })
    empresa: Empresa;

    @ManyToOne(() => Plan, plan => plan.planEmpresa)
    @JoinColumn({ name: "id_plan" })
    plan: Plan;
}