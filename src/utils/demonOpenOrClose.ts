import { CierreProvisorio } from "src/cierreProvisorio/entities/cierreProvisorio.entitty";
import { Empresa } from "src/empresa/entities/empresa.entity";  
import { handleGetGlobalConnection } from "src/utils/dbConnection";  
import * as moment from 'moment-timezone';

export const OpenOrClose = async () => {
    try {
        const globalConnection = await handleGetGlobalConnection();

        const repoEmpresa = globalConnection.getRepository(Empresa);
        const repoCierreProvisorio = globalConnection.getRepository(CierreProvisorio);
        
        const empresas = await repoEmpresa.find();

        await Promise.all(empresas.map(async (empresa: Empresa) => {
            const now = moment.tz(empresa.timeZone); 
            const hoursFormated = now.format("HH:mm:ss"); 
            
            const isWithinOperatingHours = hoursFormated >= empresa.hora_apertura && hoursFormated <= empresa.hora_cierre;
            let cierreProvisorio = false;

            const cierresProvisoriosEmpresa = await repoCierreProvisorio.find({
                where: { empresa: { id: empresa.id } }
            });

            cierresProvisoriosEmpresa.forEach((cierre) => {
                const inicio = moment.tz(cierre.inicio, empresa.timeZone);
                const final = moment.tz(cierre.final, empresa.timeZone);

                if (now.isBetween(inicio, final, undefined, '[]')) {
                    cierreProvisorio = true;
                }
            });

            empresa.abierto = !cierreProvisorio && isWithinOperatingHours;

            await repoEmpresa.save(empresa);
        }));
    } catch (error) {
        console.error('Error en OpenOrClose:', error);
    }
};
