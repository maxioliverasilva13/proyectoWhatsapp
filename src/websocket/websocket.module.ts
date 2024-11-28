import { Module } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gatewat";


@Module({
    providers:[WebsocketGateway]
})
export class WebSocketModule{   }