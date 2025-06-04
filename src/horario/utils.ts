import * as moment from 'moment-timezone';
import { HorarioService } from './horario.service';

export const estaAbierto = async (timeZone: string, horarioService: HorarioService): Promise<boolean> => {
  const now = moment.tz(timeZone);
  const dayOfWeek = now.isoWeekday();
  const horarios = await horarioService.findByDay(dayOfWeek);

  return horarios.some(horario => {
    const inicio = now.clone().set({
      hour: parseInt(horario.hora_inicio.split(':')[0], 10),
      minute: parseInt(horario.hora_inicio.split(':')[1], 10),
      second: 0,
      millisecond: 0,
    });

    const fin = now.clone().set({
      hour: parseInt(horario.hora_fin.split(':')[0], 10),
      minute: parseInt(horario.hora_fin.split(':')[1], 10),
      second: 0,
      millisecond: 0,
    });

    return inicio.isBefore(fin)
      ? now.isBetween(inicio, fin)
      : now.isSameOrAfter(inicio) || now.isBefore(fin);
  });
}
