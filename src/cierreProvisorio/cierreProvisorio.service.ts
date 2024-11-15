import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CierreProvisorio } from "./entities/cierreProvisorio.entitty";
import { Repository } from "typeorm";
import { CreateCierre } from "./dto/create-cierre.dto";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { UpdateCierre } from "./dto/update-cierre.dto";



@Injectable()
export class CierreProvisorioService {
    constructor(
        @InjectRepository(CierreProvisorio)
        private cierrePResposiory: Repository<CierreProvisorio>,
        @InjectRepository(Empresa)
        private empresaRepository: Repository<Empresa>,

    ) { }

    async create(CreateCierre: CreateCierre) {
        try {
            if (!CreateCierre.empresaId || !CreateCierre.fecha_inicio || !CreateCierre.fecha_fin) {
                throw new BadRequestException("Provide the correct data")
            }
            const empresaExist = await this.empresaRepository.findOne({ where: { id: CreateCierre.empresaId } })

            if (!empresaExist) {
                throw new BadRequestException("the empresa does not exist")
            }

            const newCierre = new CierreProvisorio()
            newCierre.empresa = empresaExist
            newCierre.inicio = CreateCierre.fecha_inicio
            newCierre.final = CreateCierre.fecha_fin
            await this.cierrePResposiory.save(newCierre)
            // que la fecha no se solape con otra
            return {
                ok: true,
                statusCode: 200,
                message: "Cierre creado correctamente",
            };

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message,
                error: 'Bad Request',
            });
        }

    }

    async find(id) {
        try {
            const findClose = await this.cierrePResposiory.findOne({
                where: { id }
            });

            if(!findClose) {
                throw new BadRequestException("there is no closure with that id")
            }
            
            return {
                ok: true,
                statusCode: 200,
                data: findClose
            };

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message,
                error: 'Bad Request',
            });
        }
    }

    async findAll(id) {
        try {
            const empresaExist = await this.empresaRepository.findOne({ where: { id } })
            if(!empresaExist) {
                throw new BadRequestException("the empresa does not exist")
            }

            const allClose = await this.cierrePResposiory.find({
                where: { empresa: { id: empresaExist.id } }
            });
            
            return {
                ok: true,
                statusCode: 200,
                data: allClose
            };

            
        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message,
                error: 'Bad Request',
            });
        }

    }

    async update(id: number, datos: UpdateCierre) {
        try {
            const cierre = await this.cierrePResposiory.findOne({ where: { id } });
    
            if (!cierre) {
                throw new BadRequestException('There is no closure with that id');
            }
    
            cierre.inicio = datos.fecha_inicio;
            cierre.final = datos.fecha_fin
    
            await this.cierrePResposiory.save(cierre);
    
            return {
                ok: true,
                statusCode: 200,
                message: "Closure updated successfully",
            };
    
        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || "Error updating closure",
                error: 'Bad Request',
            });
        }
    }
    
    async delete(id) {
        try {
            const res = await this.cierrePResposiory.delete({id: id})


            if(res.affected === 0) {
                throw new BadRequestException('there is no closure with that id ')
            }
            
            return {
                ok: true,
                statusCode: 200,
                message: "clousure delete successfully"
            };

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message,
                error: 'Bad Request',
            });
        }
    }

}
