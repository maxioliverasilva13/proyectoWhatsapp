import { CierreProvisorio } from 'src/cierreProvisorio/entities/cierreProvisorio.entitty';
import { NumeroConfianza } from 'src/numerosConfianza/entities/numeroConfianza.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { PlanEmpresa } from 'src/planEmpresa/entities/planEmpresa.entity';
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

  @Column({ type: 'time', nullable: true, default: null })
  hora_cierre: string;
  
  @Column({ type: 'time', nullable: true, default: null})
  hora_apertura: string;
  
  @Column({ default: false })
  notificarReservaHoras: boolean;

  @Column({ nullable: true })
  greenApiInstance: string;

  @Column({ nullable: true })
  greenApiInstanceToken: string;

  @Column({ nullable: true, default: 2 })
  remaindersHorsRemainder: number;

  @Column({ default: false })
  apiConfigured: boolean;

  @Column({ default: false })
  greenApiConfigured: boolean;

  @Column({ nullable: true, })
  direccion: string;

  @ManyToOne(() => Tiposervicio, (cmbe) => cmbe.empresas)
  tipoServicioId: Tiposervicio;

  @OneToMany(() => NumeroConfianza, (numeroConfianza) => numeroConfianza.empresa)
  numeroConfianza: NumeroConfianza[];

  @Column({ default: 30 })
  intervaloTiempoCalendario: number;

  @OneToMany(()=> CierreProvisorio, (CierreProvisorio)=> CierreProvisorio.empresa)
  cierre_provisorio: CierreProvisorio[];

  @Column({default:'America/Montevideo'})
  timeZone: string

  @OneToMany(()=> PlanEmpresa, (planEmpresa)=> planEmpresa.empresa)
  planEmpresa : PlanEmpresa[]
}
