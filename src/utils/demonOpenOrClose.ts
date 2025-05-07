import { CierreProvisorio } from "src/cierreProvisorio/entities/cierreProvisorio.entitty";
import { Empresa } from "src/empresa/entities/empresa.entity";  
import { handleGetGlobalConnection } from "src/utils/dbConnection";  
import * as moment from 'moment-timezone';

export const OpenOrClose = async () => {
    const globalConnection = await handleGetGlobalConnection();
    try {

        const repoEmpresa = globalConnection.getRepository(Empresa);
        const repoCierreProvisorio = globalConnection.getRepository(CierreProvisorio);
        
        const empresas = await repoEmpresa.find();

        await Promise.all(empresas.map(async (empresa: Empresa) => {
            const now = moment.tz(empresa.timeZone); 
                    
            const openingTime = moment.tz(`${now.format("YYYY-MM-DD")}T${empresa.hora_apertura}`, empresa.timeZone);
            let closingTime = moment.tz(`${now.format("YYYY-MM-DD")}T${empresa.hora_cierre}`, empresa.timeZone);
            
            if (closingTime.isBefore(openingTime)) {
                closingTime.add(1, 'day');
            }
            
            const isWithinOperatingHours = now.isBetween(openingTime, closingTime, undefined, '[]');
                        
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
    } finally {
        globalConnection.destroy();
    }
};
