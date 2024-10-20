import { TipoRol } from "src/enums/rol";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('role')
export class Role extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({
      type: 'enum',
      enum: TipoRol,
    })
    tipo: TipoRol;
}
