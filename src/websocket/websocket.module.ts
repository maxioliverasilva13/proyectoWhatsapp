import { Module } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gatewat";


@Module({
    providers:[WebsocketGateway],
    exports: [WebsocketGateway]
})
export class WebSocketModule{   }