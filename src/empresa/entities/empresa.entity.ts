import { Plan } from 'src/plan/entities/plan.entity';
import { BaseEntity } from 'src/utils/base.entity';
import { Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne } from 'typeorm';

@Entity('empresa')
@Unique(['db_name'])
export class Empresa extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  db_name: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column()
  menu: string;

  @Column()
  abierto: boolean;

  @Column()
  hora_apertura: boolean;

  @Column()
  hora_cierre: boolean;

  @Column()
  notificarReservaHoras: boolean;

  @ManyToOne(() => Plan, (plan) => plan.empresas)
  plan: Plan;

}
