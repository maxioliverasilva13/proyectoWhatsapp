import { TipoPedido } from "src/enums/tipopedido";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('tiposervicio')
export class Tiposervicio extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({
      type: 'enum',
      enum: TipoPedido,
    })
    tipo: TipoPedido;
}
