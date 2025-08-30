import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { PedidoEspaciosService } from "./pedidoEspacios.service";
import { TIPO_SERVICIO_RESERVA_ESPACIO_ID } from "src/database/seeders/app/tipopedido.seed";


@Controller('pedidoEspacio')
export class PedidoEspacioController {
    constructor(private readonly pedidoEspacioService: PedidoEspaciosService) { }

    @Get('/getAvailability')
    getAvailability(@Req() request: any,
        @Query('espacio_id') espacio_id: number,
        @Query('date') date: string,
        @Query('withPast') withPast: string) {
            console.log('recibo date', date);
            
        return this.pedidoEspacioService.calcularDisponibilidadEspacio(
            espacio_id,
            date.split(' ')[0],
        );
    }


    @Get('/calendar/formatCalendar/:date')
    getOrdersForCalendar(
        @Param('date') date: string,
        @Req() request: Request,
        @Query('espacio_id') espacio_id: number,
    ) {
        const timeZone = request['timeZone'];

        return this.pedidoEspacioService.getOrdersForCalendarByEspacio(date, timeZone, espacio_id);
    }


    @Get('/getAvailabilityForRange')
    getAvailabilityForRange(
        @Query('espacio_id') espacio_id: string,
        @Query('date') date: string,
        @Query('quantityDays') quantityDays: string,
        @Req() request: Request,
    ) {
        const timeZone = request['timeZone'];

        return this.pedidoEspacioService.verificarDisponibilidadPorRangoYHora(Number(espacio_id), date, Number(quantityDays), timeZone );
    }

}
