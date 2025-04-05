import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Device } from "./device.entity";
import { DeviceService } from "./device.service";
import { DeviceController } from "./device.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Device, Usuario])],
    providers: [DeviceService],
    controllers: [DeviceController],
    exports: [DeviceService],
})
export class DeviceModule {}