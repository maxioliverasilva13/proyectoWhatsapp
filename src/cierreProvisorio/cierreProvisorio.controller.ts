import { Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CierreProvisorioService } from "./cierreProvisorio.service";



@Controller('cierreProvisorio')
export class CierreProvisorioController {
    constructor ( private readonly cierreProvisorioService: CierreProvisorioService) {}

    @Post() 
    create() {
        return this.cierreProvisorioService.create();
    }

    @Get('id') 
    find(@Param('id') id : number  ) {
        return this.cierreProvisorioService.find(id);
    }

    @Get() 
    findAll() {
        return this.cierreProvisorioService.findAll();
    }

    @Put('id') 
    update(@Param('id') id : number) {
        return this.cierreProvisorioService.update(id);
    }

    @Delete('id') 
    delete(@Param('id') id : number) {
        return this.cierreProvisorioService.delete(id);
    }
}