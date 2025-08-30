import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
} from 'typeorm';
import { Espacio } from './espacio';


@Entity('precio')
export class Precio extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: ['minutos', 'horas', 'dias'], default: 'horas' })
    tipo_intervalo: 'minutos' | 'horas' | 'dias';

    @Column({ type: 'int', default: 1 })
    duracion_intervalo: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio: number;

    @ManyToOne(() => Espacio, (espacio) => espacio.precios, { onDelete: 'CASCADE' })
    espacio: Espacio;
}
