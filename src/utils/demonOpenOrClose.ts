import { CierreProvisorio } from "src/cierreProvisorio/entities/cierreProvisorio.entitty";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Horario } from "src/horario/entities/horario.entity";
import { handleGetCurrentConnection, handleGetGlobalConnection } from "src/utils/dbConnection";
import * as moment from 'moment-timezone';

export const OpenOrClose = async () => {
    const globalConnection = await handleGetGlobalConnection();
    const currentConnection = await handleGetCurrentConnection();

    try {
        const repoEmpresa = globalConnection.getRepository(Empresa);
        const repoCierreProvisorio = globalConnection.getRepository(CierreProvisorio);
        const repoHorario = currentConnection.getRepository(Horario);

        const empresas = await repoEmpresa.find();

        await Promise.all(empresas.map(async (empresa: Empresa) => {
            const now = moment.tz(empresa.timeZone);
            const diaSemana = now.isoWeekday();

            const horarios = await repoHorario.find({
                where: {
                    dayOfWeek: diaSemana,
                },
            });

            let estaDentroDeHorario = false;

            for (const horario of horarios) {
                const apertura = moment.tz(`${now.format("YYYY-MM-DD")}T${horario.hora_inicio}`, empresa.timeZone);
                let cierre = moment.tz(`${now.format("YYYY-MM-DD")}T${horario.hora_fin}`, empresa.timeZone);

                if (cierre.isBefore(apertura)) {
                    cierre.add(1, 'day');
                }

                if (now.isBetween(apertura, cierre, undefined, '[]')) {
                    estaDentroDeHorario = true;
                    break;
                }
            }

            let cierreProvisorio = false;
            const cierresProvisorios = await repoCierreProvisorio.find({
                where: { empresa: { id: empresa.id } },
            });

            for (const cierre of cierresProvisorios) {
                const inicio = moment.tz(cierre.inicio, empresa.timeZone);
                const final = moment.tz(cierre.final, empresa.timeZone);
                if (now.subtract("3", "hours").isBetween(inicio, final, undefined, '[]')) {
                    cierreProvisorio = true;
                    break;
                }
            }

            empresa.abierto = estaDentroDeHorario && !cierreProvisorio;
            await repoEmpresa.save(empresa);
        }));

    } catch (error) {
        console.error('Error en OpenOrClose:', error);
    } finally {
        globalConnection.destroy();
    }
};
