import { Body, Controller, Delete, Get, Param, Post, Put, Req } from "@nestjs/common";
import { NumeroConfianzaService } from "./numeroConfianza.service";
import { numeroConfianzaDto } from "./dto/numeroConfianza.create";

@Controller('numeroConfianza')
export class NumeroConfianzaController {
    constructor(
        private readonly numeroConfianzaService : NumeroConfianzaService
    ) {
    }

    @Post() 
    async create(@Req() request: Request, @Body() data : numeroConfianzaDto) {
        const empresaId = request['empresaId']
        return await this.numeroConfianzaService.create(data,empresaId)

    }

    @Get()
    async getAll(@Req() request: Request){
        const empresaId = request['empresaId']
        return await this.numeroConfianzaService.getAll(empresaId)
    }

    @Get(':id')
    async getOne(@Param('id') numberPhone : number, @Req() request: Request){
        const empresaId = request['empresaId']        
        return await this.numeroConfianzaService.getOne(numberPhone, empresaId)
    }

    @Put(':id')
    async Update(@Param('id') id : number, @Body() datos){
        return await this.numeroConfianzaService.Update(id, datos)
    }

    @Delete(':id')
    async Delete(@Param('id') id : number){
        return await this.numeroConfianzaService.Delete(id)
    }

}