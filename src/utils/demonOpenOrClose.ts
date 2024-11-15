import { CierreProvisorio } from "src/cierreProvisorio/entities/cierreProvisorio.entitty";
import { Empresa } from "src/empresa/entities/empresa.entity";  
import { handleGetGlobalConnection } from "src/utils/dbConnection";  

export const OpenOrClose = async () => {
    try {
        const globalConnection = await handleGetGlobalConnection();

        const repoEmpresa = globalConnection.getRepository(Empresa);
        const repoCierreProvisorio = globalConnection.getRepository(CierreProvisorio);

        const now = new Date()
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const hoursFormated = `${hours}:${minutes}:${seconds}`
        console.log(hoursFormated);
        
        const empresas = await repoEmpresa.find();

        await Promise.all(empresas.map(async (empresa: Empresa) => {
            let open =  hoursFormated >= empresa.hora_apertura && hoursFormated <= empresa.hora_cierre 
            let cierreProvisorio = false;
            // de las empresas me traigo sus cierres pprovisoriso
            const cierresProvisoriosEmpresa = await repoCierreProvisorio.find({where:{empresa:{id:empresa.id}}})

            cierresProvisoriosEmpresa.map((cierre)=> {
                cierreProvisorio = now >= cierre.inicio && now <= cierre.final
            })

            if(cierreProvisorio) {                
                empresa.abierto = false;
            } else {
                empresa.abierto = open
            }
                        
            repoEmpresa.save(empresa)
        }))
    } catch (error) {
        console.error('Error en OpenOrClose:', error);
    }
};
