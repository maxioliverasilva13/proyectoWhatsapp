import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server  } from "socket.io";

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    
    handleConnection(client: any, ...args: any[]) {
        console.log('client connected');
        
    }

    handleDisconnect(client: any) {
        console.log('client dissconected');

    }

    @SubscribeMessage('greenApiStatus')
    async sendGreenApiStatus() {
        const greenApiStatus = { status:true, timestamp: new Date() };

        this.server.emit('greenApiStatusResponse', greenApiStatus);
    }

    @SubscribeMessage('sendOrder')
    async sendOrder(body : any) {
        this.server.emit('sendOrderRealTime', body);
    }
}   