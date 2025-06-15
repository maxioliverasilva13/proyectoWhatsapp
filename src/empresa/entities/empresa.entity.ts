import { CierreProvisorio } from 'src/cierreProvisorio/entities/cierreProvisorio.entitty';
import { Currency } from 'src/currencies/entities/currency.entity';
import { Horario } from 'src/horario/entities/horario.entity';
import { NumeroConfianza } from 'src/numerosConfianza/entities/numeroConfianza.entity';
import { Payment } from 'src/payments/payment.entity';
import { PlanEmpresa } from 'src/planEmpresa/entities/planEmpresa.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { BaseEntity } from 'src/utils/base.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

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

  @Column({ default: false })
  abierto: boolean;

  @Column({ default: true, nullable: false })
  assistentEnabled: boolean;

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
  deploy: boolean;

  @Column({ default: false })
  greenApiConfigured: boolean;

  @Column({ nullable: true })
  direccion: string;

  @ManyToOne(() => Tiposervicio, (cmbe) => cmbe.empresas)
  tipoServicioId: Tiposervicio;

  @OneToMany(
    () => NumeroConfianza,
    (numeroConfianza) => numeroConfianza.empresa,
  )
  numeroConfianza: NumeroConfianza[];

  @Column({ default: 30 })
  intervaloTiempoCalendario: number;

  @OneToMany(
    () => CierreProvisorio,
    (CierreProvisorio) => CierreProvisorio.empresa,
  )
  cierre_provisorio: CierreProvisorio[];

  @Column({ default: 'America/Montevideo' })
  timeZone: string;

  @Column({ nullable: true, default: "" })
  transferText: string;

  @OneToMany(() => Currency, (curr) => curr.empresa)
  currencies: Currency[];

  @OneToOne(() => Payment, (emp) => emp.empresa, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  payment: Payment;
}
