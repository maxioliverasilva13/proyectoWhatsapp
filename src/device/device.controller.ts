import { Controller, Post, Body, Param, Request } from "@nestjs/common";
import { DeviceService } from "./device.service";

@Controller('device')
export class DeviceController {
    constructor(private readonly dispositivoService: DeviceService) {}

    @Post()
    async registrarDispositivo(
        @Body('fcmToken') fcmToken: string,
        @Request() req
    ) {
        const userId = req?.user?.userId;
        return this.dispositivoService.registrarDispositivo(userId, fcmToken);
    } 


    @Post("notify/empresa/:empresaId")
    async sendNotificationToEmpresa(
        @Param("empresaId") empresaId: number,
        @Body("title") title: string,
        @Body("description") desc: string
    ) {
        return this.dispositivoService.sendNotificationEmpresa(empresaId, title, desc);
    }

    @Post("notify/:userId")
    async enviarNotificacionAUsuario(
        @Param("userId") userId: number,
        @Body("title") title: string,
        @Body("description") desc: string
    ) {
        return this.dispositivoService.sendNotificationUser(userId, title, desc);
    }
}
