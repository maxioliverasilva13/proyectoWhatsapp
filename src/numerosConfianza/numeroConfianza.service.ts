import { BadRequestException, Injectable, Req } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NumeroConfianza } from "./entities/numeroConfianza.entity";
import { numeroConfianzaDto } from "./dto/numeroConfianza.create";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { handleGetGlobalConnection } from "src/utils/dbConnection";


@Injectable()
export class NumeroConfianzaService {

    private NmroConfianzaRepository: Repository<NumeroConfianza>;

    private empresaRepository : Repository<Empresa>

    async onModuleInit() {
      const globalConnection = await handleGetGlobalConnection();
      this.NmroConfianzaRepository = globalConnection.getRepository(NumeroConfianza); 
      this.empresaRepository = globalConnection.getRepository(Empresa); 
    }

    async getAll(empresaId) {
        try {
            const allNumbers = await this.NmroConfianzaRepository.find({
                where:{empresa:{id:empresaId}}
            })

            return {
                ok:true,
                statusCode:200,
                data: allNumbers
            }

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al obtener los numeros',
                error: 'Bad Request',
            });
        }
    }

    async getOne(numberPhone, empresaId) {
        try {            
            const empresa = await this.empresaRepository.findOne({ where: { id: empresaId } });
            
            const numberDate = await this.NmroConfianzaRepository.findOne({
                where:{telefono:numberPhone,empresa: { id: empresa.id }  }
            })
            console.log(numberDate);
            
            return {
                ok:true,
                statusCode:200,
                data: numberDate,
            }

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al obtener el numero',
                error: 'Bad Request',
            });
        }
    }

    async Create(datos : numeroConfianzaDto, empresaId) {
        try {
            const empresa = await this.empresaRepository.findOne({ where: { id: empresaId } });
            
            if(!datos.nombre || !datos.telefono) {
                return new BadRequestException('Debes de proporcionar los datos validos')
            }

            const nroConfianza = new NumeroConfianza
            nroConfianza.nombre = datos.nombre;
            nroConfianza.telefono = datos.telefono
            nroConfianza.empresa = empresa

            await this.NmroConfianzaRepository.save(nroConfianza)

            return {
                ok:true,
                statusCode:200,
                message: "numero de confianza creado correctamente"
            }

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al crear el nro de confiana',
                error: 'Bad Request',
            });
        }
    }

    async Update(idNumber, datos) {
        try {
            const numberConfianza = await this.NmroConfianzaRepository.findOne({
                where:{id:idNumber}
            })
            if(!numberConfianza) {
                return new BadRequestException('Debes de proporcionar un id valido')
            }
            numberConfianza.nombre = datos.nombre;
            numberConfianza.telefono = datos.telefono;

            await this.NmroConfianzaRepository.save(numberConfianza)

            return {
                ok:true,
                statusCode:200,
                message: "numero de confianza actualizado correctamente"
            }

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al actualizar el pedido ',
                error: 'Bad Request',
            });
        }
    }

    async Delete(idNumber: number) {
        try {
            const result = await this.NmroConfianzaRepository.delete(idNumber);
    
            if (result.affected === 0) {
                throw new BadRequestException('No se encontró un registro con el ID proporcionado');
            }
    
            return {
                ok: true,
                statusCode: 200,
                message: 'Registro eliminado correctamente',
            };
        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al eliminar el registro',
                error: 'Bad Request',
            });
        }
    }
    
}