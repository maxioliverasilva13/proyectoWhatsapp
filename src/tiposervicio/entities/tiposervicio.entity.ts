import { Empresa } from "src/empresa/entities/empresa.entity";
import { TipoPedido } from "src/enums/tipopedido";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('tiposervicio')
export class Tiposervicio extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @OneToMany(() => Empresa, (cmbe) => cmbe.tipoServicio)
    empresas: Empresa[];

    @Column({
      type: 'enum',
      enum: TipoPedido,
    })
    tipo: TipoPedido;
}
