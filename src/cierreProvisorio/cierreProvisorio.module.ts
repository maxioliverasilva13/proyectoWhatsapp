import { Module } from "@nestjs/common";
import { CierreProvisorioService } from "./cierreProvisorio.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CierreProvisorio } from "./entities/cierreProvisorio.entitty";
import { CierreProvisorioController } from "./cierreProvisorio.controller";
import { EmpresaModule } from "src/empresa/empresa.module";


@Module({
    imports:[TypeOrmModule.forFeature([CierreProvisorio]),EmpresaModule],
    controllers:[CierreProvisorioController],
    providers:[CierreProvisorioService],
    exports:[CierreProvisorioService]
})
export class CierreProvisorioModule {}
