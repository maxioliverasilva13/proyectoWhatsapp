import { IsInt, IsString, Matches } from 'class-validator';

export class CreateHorarioDto {
  @IsInt()
  dayOfWeek: number; 

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'hora_inicio debe estar en formato HH:mm' })
  hora_inicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'hora_fin debe estar en formato HH:mm' })
  hora_fin: string;
}
