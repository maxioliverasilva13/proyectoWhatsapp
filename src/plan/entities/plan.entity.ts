import { Payment } from "src/payments/payment.entity";
import { PlanEmpresa } from "src/planEmpresa/entities/planEmpresa.entity";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('planinfo')
@Unique(['product_sku'])
export class Plan extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ default: true })
    active: boolean;

    @Column({ nullable: false, default: "" })
    product_sku: string;

    @Column()
    costoUSD: number;

    @Column()
    diasDuracion: number;

    @Column({ default: false })
    mostPoppular: boolean;

    @Column({ default: false })
    isWeb: boolean

    @Column()
    adventages: string;

    @Column()
    maxPedidos: number;

    @OneToMany(() => Payment, (planEmpresa) => planEmpresa.plan)
    payments: Payment[]
}
