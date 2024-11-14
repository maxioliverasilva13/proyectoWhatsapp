import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CierreProvisorio } from "./entities/cierreProvisorio.entitty";
import { Repository } from "typeorm";



@Injectable()
export class CierreProvisorioService {
    constructor(
        @InjectRepository(CierreProvisorio)
        private cierrePResposiory : Repository<CierreProvisorio> 
    ) {}

    async create() {
        return "Crear"

    }

    async find(id) {
        return "Encontrar"

    }

    async findAll() {
        return "Todos"

    }

    async update(id) {
        return "Actualizar"

    }

    async delete(id) {
        return "Borrar"
    }

}
