import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TipoPedido } from 'src/enums/tipopedido';
import { Horario } from 'src/horario/entities/horario.entity';

export class HorarioSeed implements Seeder {
    async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager,
    ): Promise<void> {
        const horarioRepository = dataSource.getRepository(Horario);

        const defaultHorarios = [
            {
                id: 1,
                dayOfWeek: 0,
                hora_inicio: "09:00",
                hora_fin: "13:00"
            },
            {
                id: 2,
                dayOfWeek: 0,
                hora_inicio: "14:00",
                hora_fin: "18:00"
            },

            {
                id: 3,
                dayOfWeek: 1,
                hora_inicio: "09:00",
                hora_fin: "13:00"
            },
            {
                id: 4,
                dayOfWeek: 1,
                hora_inicio: "14:00",
                hora_fin: "18:00"
            },
            {
                id: 5,
                dayOfWeek: 2,
                hora_inicio: "09:00",
                hora_fin: "13:00"
            },
            {
                id: 6,
                dayOfWeek: 2,
                hora_inicio: "14:00",
                hora_fin: "18:00"
            },
            {
                id: 7,
                dayOfWeek: 3,
                hora_inicio: "09:00",
                hora_fin: "13:00"
            },
            {
                id: 8,
                dayOfWeek: 3,
                hora_inicio: "14:00",
                hora_fin: "18:00"
            },
            {
                id: 9,
                dayOfWeek: 4,
                hora_inicio: "09:00",
                hora_fin: "13:00"
            },
            {
                id: 10,
                dayOfWeek: 4,
                hora_inicio: "14:00",
                hora_fin: "18:00"
            },
            {
                id: 11,
                dayOfWeek: 5,
                hora_inicio: "09:00",
                hora_fin: "13:00"
            },
        ];

        const horariosExists = await horarioRepository.find();

        if (horariosExists?.length !== 0) {
            return;
        }

        await Promise.all(
            defaultHorarios?.map(async (horario) => {
                return await horarioRepository.save(horario);
            }),
        );
    }
}
