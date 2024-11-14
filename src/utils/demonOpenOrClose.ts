import { Empresa } from "src/empresa/entities/empresa.entity";  
import { handleGetGlobalConnection } from "src/utils/dbConnection";  

export const OpenOrClose = async () => {
    try {

        // console.log("Proceso OpenOrClose")
        // const globalConnection = await handleGetGlobalConnection();

        // const repoEmpresa = globalConnection.getRepository(Empresa);
        // const now = new Date()
        // const hours = now.getHours().toString().padStart(2, '0');
        // const minutes = now.getMinutes().toString().padStart(2, '0');
        // const seconds = now.getSeconds().toString().padStart(2, '0');
        
        // const hoursFormated = `${hours}:${minutes}:${seconds}`
        
        // const empresas = await repoEmpresa.find();

        // await Promise.all(empresas.map(async (empresa: Empresa) => {
        //     let open = empresa.hora_apertura >= hoursFormated && empresa.hora_cierre <= hoursFormated
    
        //     // open === true? empresa.abierto = true : empresa.abierto = false
        //     const estaEnCierreProvisorio = now >= empresa.inicio_cierre_provisorio && now <= empresa.fin_cierre_provisorio
        //     if(estaEnCierreProvisorio) {
        //         empresa.abierto = false;
        //     } else {
        //         empresa.abierto = open
        //     }
    
        //     console.log("Abierto",empresa.abierto);
            
            
        //     repoEmpresa.save(empresa)
    
        //     if (empresa) {
        //         console.log('Empresa encontrada:', empresa);
        //     } else {
        //         console.log('No se encontró la empresa');
        //     }

        // }))
    } catch (error) {
        console.error('Error en OpenOrClose:', error);
    }
};
