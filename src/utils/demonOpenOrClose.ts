import { Empresa } from "src/empresa/entities/empresa.entity";  
import { handleGetGlobalConnection } from "src/utils/dbConnection";  
import { LessThan, MoreThan } from "typeorm";

export const OpenOrClose = async () => {
    try {
        const globalConnection = await handleGetGlobalConnection();

        const repoEmpresa = globalConnection.getRepository(Empresa);
        const now = new Date()
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const hoursFormated = `${hours}:${minutes}:${seconds}`
        
        const empresa = await repoEmpresa.findOne({ where: { db_name: process.env.SUBDOMAIN } });
        let open = empresa.hora_apertura >= hoursFormated && empresa.hora_cierre <= hoursFormated && !empresa.cierre_provisorio

        open === true? empresa.abierto = true : empresa.abierto = false

        repoEmpresa.save(empresa)

        if (empresa) {
            console.log('Empresa encontrada:', empresa);
        } else {
            console.log('No se encontró la empresa');
        }
    } catch (error) {
        console.error('Error en OpenOrClose:', error);
    }
};
