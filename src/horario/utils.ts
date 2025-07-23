import * as moment from 'moment-timezone';
import { HorarioService } from './horario.service';

export const estaAbierto = async (timeZone: string, horarioService: HorarioService): Promise<boolean> => {
  const now = moment.tz(timeZone);
  const dayOfWeek = now.isoWeekday();
  
  console.log(`[DEBUG] estaAbierto - Zona horaria: ${timeZone}`);
  console.log(`[DEBUG] estaAbierto - Momento actual: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`[DEBUG] estaAbierto - Día de la semana: ${dayOfWeek} (${now.format('dddd')})`);
  
  const horarios = await horarioService.findByDay(dayOfWeek);
  console.log(`[DEBUG] estaAbierto - Horarios encontrados:`, horarios);

  if (!horarios || horarios.length === 0) {
    console.log(`[DEBUG] estaAbierto - No hay horarios para el día ${dayOfWeek}, retornando false`);
    return false;
  }

  const resultado = horarios.some((horario, index) => {
    console.log(`[DEBUG] estaAbierto - Verificando horario ${index + 1}:`, {
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin
    });

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

    console.log(`[DEBUG] estaAbierto - Horario ${index + 1} parseado:`);
    console.log(`  - Inicio: ${inicio.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  - Fin: ${fin.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`  - Ahora: ${now.format('YYYY-MM-DD HH:mm:ss')}`);

    const esHorarioNormal = inicio.isBefore(fin);
    console.log(`[DEBUG] estaAbierto - ¿Es horario normal (no cruza medianoche)?: ${esHorarioNormal}`);

    let estaEnRango;
    if (esHorarioNormal) {
      // Horario normal (ej: 09:00 - 18:00)
      estaEnRango = now.isBetween(inicio, fin);
      console.log(`[DEBUG] estaAbierto - Horario normal: now.isBetween(${inicio.format('HH:mm')}, ${fin.format('HH:mm')}) = ${estaEnRango}`);
    } else {
      // Horario que cruza medianoche (ej: 22:00 - 06:00)
      const despuesDeinicio = now.isSameOrAfter(inicio);
      const antesDeFin = now.isBefore(fin);
      estaEnRango = despuesDeinicio || antesDeFin;
      console.log(`[DEBUG] estaAbierto - Horario nocturno:`);
      console.log(`  - ¿Después o igual al inicio (${inicio.format('HH:mm')})?: ${despuesDeinicio}`);
      console.log(`  - ¿Antes del fin (${fin.format('HH:mm')})?: ${antesDeFin}`);
      console.log(`  - Resultado (${despuesDeinicio} || ${antesDeFin}): ${estaEnRango}`);
    }

    console.log(`[DEBUG] estaAbierto - Horario ${index + 1} está abierto: ${estaEnRango}`);
    return estaEnRango;
  });

  console.log(`[DEBUG] estaAbierto - Resultado final: ${resultado}`);
  return resultado;
}
