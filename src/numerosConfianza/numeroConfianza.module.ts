import { Module } from "@nestjs/common";
import { NumeroConfianzaService } from "./numeroConfianza.service";
import { NumeroConfianzaController } from "./numeroConfianza.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NumeroConfianza } from "./entities/numeroConfianza.entity";
import { EmpresaModule } from "src/empresa/empresa.module";

@Module({
    imports:[TypeOrmModule.forFeature([NumeroConfianza]), EmpresaModule],
    providers:[NumeroConfianzaService],
    controllers:[NumeroConfianzaController],
    exports:[NumeroConfianzaService]
})
export class NumeroConfianzaModule {}