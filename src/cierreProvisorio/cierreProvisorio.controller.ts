import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CierreProvisorioService } from "./cierreProvisorio.service";
import { CreateCierre } from "./dto/create-cierre.dto";
import { UpdateCierre } from "./dto/update-cierre.dto";

@Controller('cierreProvisorio')
export class CierreProvisorioController {
    constructor ( private readonly cierreProvisorioService: CierreProvisorioService) {}

    @Post() 
    create(@Body() crateCierre : CreateCierre) {
        return this.cierreProvisorioService.create(crateCierre);
    }

    @Get(':idCierre') 
    find(@Param('idCierre') idCierre : number  ) {
        return this.cierreProvisorioService.find(idCierre);
    }

    @Get('all/:id') 
    findAll(@Param('id') id : number) {
        return this.cierreProvisorioService.findAll(id);
    }

    @Put(':id') 
    update(@Param('id') id : number, @Body() datosUpdate : UpdateCierre) {
        return this.cierreProvisorioService.update(id,datosUpdate);
    }

    @Delete(':id') 
    delete(@Param('id') id : number) {
        return this.cierreProvisorioService.delete(id);
    }
}