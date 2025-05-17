import { Cambioestadopedido } from 'src/cambioestadopedido/entities/cambioestadopedido.entity';
import { Device } from 'src/device/device.entity';
import { BaseEntity } from 'src/utils/base.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('usuario')
@Index('idx_usuario_id_correo', ['id', 'correo'], { unique: true })
export class Usuario extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ default: false, nullable: true })
  isAdmin: boolean;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column()
  apellido: string;

  @Column()
  correo: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  id_empresa: number;

  @Column()
  id_rol: number;

  @Column({ nullable: true })
  activo: boolean;

  @Column({ default: false })
  firstUser: boolean;

  @Column({
    nullable: true,
    default: 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png',
  })
  image: string;

  @OneToMany(() => Device, (dispositivo) => dispositivo.usuario, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  dispositivos: Device[];
}
