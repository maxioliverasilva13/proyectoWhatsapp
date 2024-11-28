import { TipoInfoLine } from "src/enums/tipoInfoLine";
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('infoline')
@Unique(['nombre'])
export class Infoline {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ default: false })
    requerido: boolean;

    @Column({ default: false })
    es_defecto: boolean;

    @Column({
      type: 'enum',
      enum: TipoInfoLine,
    })
    tipo: TipoInfoLine;

    @Column()
    id_tipo_servicio: number;
}
