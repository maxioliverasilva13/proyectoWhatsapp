import { Plan } from 'src/plan/entities/plan.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { BaseEntity } from 'src/utils/base.entity';
import { Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, OneToMany } from 'typeorm';

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

  @Column({ nullable: true })
  menu: string;

  @Column( { default: false })
  abierto: boolean;

  @Column({ nullable: true})
  hora_apertura: Date;

  @Column({  nullable: true })
  hora_cierre: Date;

  @Column({ default: false })
  notificarReservaHoras: boolean;

  @ManyToOne(() => Plan, (plan) => plan.empresas)
  plan: Plan;

  @ManyToOne(() => Tiposervicio, (cmbe) => cmbe.empresas)
  tipoServicio: Tiposervicio;

  @Column({ nullable: true })
  greenApiInstance: string;

  @Column({ nullable: true })
  greenApiInstanceToken: string;
}
