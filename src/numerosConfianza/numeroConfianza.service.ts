import { BadRequestException, Injectable, OnModuleDestroy, Req } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Like, Repository } from "typeorm";
import { NumeroConfianza } from "./entities/numeroConfianza.entity";
import { numeroConfianzaDto } from "./dto/numeroConfianza.create";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { handleGetGlobalConnection } from "src/utils/dbConnection";


@Injectable()
export class NumeroConfianzaService implements OnModuleDestroy {

    private NmroConfianzaRepository: Repository<NumeroConfianza>;

    private empresaRepository: Repository<Empresa>;

    private globalConnection: DataSource;

    constructor(
        @InjectRepository(NumeroConfianza)
        private readonly defaultNmroConfianzaRepo: Repository<NumeroConfianza>,

        @InjectRepository(Empresa)
        private readonly defaultEmpresaRepo: Repository<Empresa>
    ) { }

    async onModuleInit() {
        if (process.env.SUBDOMAIN !== 'app') {
            if (!this.globalConnection) {
                this.globalConnection = await handleGetGlobalConnection();
            }
            this.NmroConfianzaRepository = this.globalConnection.getRepository(NumeroConfianza);
            this.empresaRepository = this.globalConnection.getRepository(Empresa);
        } else {
            this.NmroConfianzaRepository = this.defaultNmroConfianzaRepo;
            this.empresaRepository = this.defaultEmpresaRepo;
        }
    }

    async onModuleDestroy() {
        if (this.globalConnection && this.globalConnection.isInitialized) {
            await this.globalConnection.destroy();
        }
    }

    async create(info: numeroConfianzaDto, empresaId: number) {
        try {
            const empresaExist = await this.empresaRepository.findOne({ where: { id: empresaId } });

            if (!empresaExist) {
                throw new BadRequestException("There no are empresa with that id")
            }
            const existNumberWithPhone = await this.NmroConfianzaRepository.findOne({ where: { telefono: info.telefono } })

            if (existNumberWithPhone) {
                throw new BadRequestException("There is already a number with that phone number")
            }

            const newNumber = await this.NmroConfianzaRepository.create({
                nombre: info.nombre,
                telefono: info.telefono,
                empresa: empresaExist
            })

            await this.NmroConfianzaRepository.save(newNumber)

            return {
                ok: true,
                message: "number trusted created successfully",
                data: newNumber
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

    async getAll(empresaId) {
        try {
            console.log('entro aqui el empresas id es', empresaId );
            
            const allNumbers = await this.NmroConfianzaRepository.find({
                where: { empresa: { id: empresaId } }
            })

            return {
                ok: true,
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
                where: {
                    telefono: Like(`%${numberPhone}%`),
                    empresa: { id: empresa.id }
                }
            });

            console.log(numberDate);

            return {
                ok: true,
                statusCode: 200,
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

    async Update(idNumber, datos) {
        try {
            const numberConfianza = await this.NmroConfianzaRepository.findOne({
                where: { id: idNumber }
            })
            if (!numberConfianza) {
                return new BadRequestException('Debes de proporcionar un id valido')
            }
            numberConfianza.nombre = datos.nombre;
            numberConfianza.telefono = datos.telefono;

            await this.NmroConfianzaRepository.save(numberConfianza)

            return {
                ok: true,
                statusCode: 200,
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